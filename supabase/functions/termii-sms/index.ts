import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendOTPRequest {
  phone: string;
  action: 'send_verification' | 'verify_code';
  code?: string;
}

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const termiiApiKey = 'TLoKQsvIlcSxHmM3AyxOCQgRgWEZSBgKmTSnDf2ozdeqLxo56anMUUCb84mzAg';
const termiiSenderId = 'N-Alert';

// Validate environment variables
if (!supabaseUrl || !supabaseServiceKey || !termiiApiKey || !termiiSenderId) {
  console.error('Missing required environment variables:', {
    supabaseUrl: !!supabaseUrl,
    supabaseServiceKey: !!supabaseServiceKey,
    termiiApiKey: !!termiiApiKey,
    termiiSenderId: !!termiiSenderId
  });
}

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

const sendOTP = async (phone: string): Promise<string> => {
  try {
    console.log('Attempting to send OTP via TERMII to:', phone);
    
    const requestBody = {
      api_key: termiiApiKey,
      message_type: "NUMERIC",
      to: phone,
      from: termiiSenderId,
      channel: "dnd",
      pin_attempts: 3,
      pin_time_to_live: 10,
      pin_length: 6,
      pin_placeholder: "< 1234 >",
      message_text: "Your FindWhoSabi verification code is < 1234 >. Valid for 10 minutes."
    };
    
    console.log('Sending OTP via TERMII with payload:', { ...requestBody, api_key: '[HIDDEN]' });

    const response = await fetch('https://v3.api.termii.com/api/sms/otp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();
    console.log('TERMII OTP Response status:', response.status);
    console.log('TERMII OTP Response:', result);
    
    if (!response.ok) {
      console.error('TERMII OTP failed:', result);
      throw new Error(result.message || `HTTP ${response.status}: Failed to send OTP`);
    }
    
    // Check for successful response - TERMII OTP returns pinId on success
    if (!result.pinId) {
      console.error('TERMII OTP failed - no pinId returned:', result);
      throw new Error(result.message || 'Failed to send OTP - no pinId returned');
    }
    
    console.log('OTP sent successfully, pinId:', result.pinId);
    return result.pinId;
  } catch (error) {
    console.error('OTP sending failed:', error);
    throw error;
  }
};

const verifyOTP = async (pinId: string, pin: string): Promise<boolean> => {
  try {
    console.log('Attempting to verify OTP via TERMII, pinId:', pinId, 'pin:', pin);
    
    const requestBody = {
      api_key: termiiApiKey,
      pin_id: pinId,
      pin: pin
    };
    
    console.log('Verifying OTP via TERMII');

    const response = await fetch('https://v3.api.termii.com/api/sms/otp/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();
    console.log('TERMII OTP Verify Response status:', response.status);
    console.log('TERMII OTP Verify Response:', result);
    
    if (!response.ok) {
      console.error('TERMII OTP verification failed:', result);
      throw new Error(result.message || `HTTP ${response.status}: Failed to verify OTP`);
    }
    
    // Check if verification was successful
    if (result.verified !== true) {
      console.error('TERMII OTP verification failed:', result);
      throw new Error(result.message || 'Invalid verification code');
    }
    
    console.log('OTP verified successfully');
    return true;
  } catch (error) {
    console.error('OTP verification failed:', error);
    throw error;
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, action, code }: SendOTPRequest = await req.json();

    if (!phone) {
      throw new Error('Phone number is required');
    }

    // Clean phone number (remove spaces, add country code if missing)
    const cleanPhone = phone.replace(/\s/g, '');
    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;

    if (action === 'send_verification') {
      // Send OTP using TERMII and get pinId
      const pinId = await sendOTP(formattedPhone);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // For new users during signup, create a temporary record with pinId
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('phone', formattedPhone)
        .single();

      if (!existingUser) {
        // Store pinId in phone_verifications table for new users
        const { error: insertError } = await supabase
          .from('phone_verifications')
          .insert({
            phone: formattedPhone,
            verification_code: pinId, // Store pinId as verification_code
            expires_at: expiresAt.toISOString(),
            created_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('Phone verification insert error:', insertError);
          // Try updating if record exists
          const { error: updateError } = await supabase
            .from('phone_verifications')
            .update({
              verification_code: pinId,
              expires_at: expiresAt.toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('phone', formattedPhone);

          if (updateError) {
            console.error('Phone verification update error:', updateError);
            throw new Error('Failed to store verification code');
          }
        }
      } else {
        // Update existing user with pinId
        const { error: dbError } = await supabase
          .from('users')
          .update({
            phone_verification_code: pinId,
            phone_verification_expires: expiresAt.toISOString(),
          })
          .eq('phone', formattedPhone);

        if (dbError) {
          console.error('Database error:', dbError);
          throw new Error('Failed to store verification code');
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Verification code sent successfully' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );

    } else if (action === 'verify_code') {
      if (!code) {
        throw new Error('Verification code is required');
      }

      // Check existing user or phone verification record to get pinId
      const { data: existingUser } = await supabase
        .from('users')
        .select('phone_verification_code, phone_verification_expires')
        .eq('phone', formattedPhone)
        .single();

      let verificationData;
      if (existingUser) {
        verificationData = existingUser;
      } else {
        // Check phone_verifications table
        const { data: phoneVerification, error: phoneError } = await supabase
          .from('phone_verifications')
          .select('verification_code, expires_at')
          .eq('phone', formattedPhone)
          .single();

        if (phoneError || !phoneVerification) {
          throw new Error('Verification code not found');
        }
        
        verificationData = {
          phone_verification_code: phoneVerification.verification_code,
          phone_verification_expires: phoneVerification.expires_at
        };
      }

      const now = new Date();
      const expiresAt = new Date(verificationData.phone_verification_expires);

      if (now > expiresAt) {
        throw new Error('Verification code has expired');
      }

      // Verify OTP using TERMII API with pinId and code
      const pinId = verificationData.phone_verification_code;
      const isVerified = await verifyOTP(pinId, code);

      if (!isVerified) {
        throw new Error('Invalid verification code');
      }

      // If user exists, mark as verified
      if (existingUser) {
        const { error: updateError } = await supabase
          .from('users')
          .update({
            phone_verified: true,
            phone_verification_code: null,
            phone_verification_expires: null,
          })
          .eq('phone', formattedPhone);

        if (updateError) {
          throw new Error('Failed to verify phone number');
        }
      } else {
        // Delete from phone_verifications table
        await supabase
          .from('phone_verifications')
          .delete()
          .eq('phone', formattedPhone);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Phone number verified successfully' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    throw new Error('Invalid action');

  } catch (error: any) {
    console.error('OTP function error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
};

serve(handler);