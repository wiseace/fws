import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendSMSRequest {
  phone: string;
  action: 'send_verification' | 'verify_code';
  code?: string;
}

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

// Validate environment variables
if (!supabaseUrl || !supabaseServiceKey || !twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
  console.error('Missing required environment variables:', {
    supabaseUrl: !!supabaseUrl,
    supabaseServiceKey: !!supabaseServiceKey,
    twilioAccountSid: !!twilioAccountSid,
    twilioAuthToken: !!twilioAuthToken,
    twilioPhoneNumber: !!twilioPhoneNumber
  });
}

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendSMS = async (phone: string, message: string): Promise<boolean> => {
  try {
    console.log('Attempting to send SMS to:', phone);
    console.log('Using Twilio credentials:', twilioAccountSid ? 'Account SID present' : 'Account SID missing');
    
    // Encode credentials for Basic Auth
    const credentials = btoa(`${twilioAccountSid}:${twilioAuthToken}`);
    
    const requestBody = new URLSearchParams({
      From: `+${twilioPhoneNumber.replace(/^\+/, '')}`,
      To: phone,
      Body: message,
    });
    
    console.log('Sending SMS via Twilio to:', phone);

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: requestBody,
    });

    const result = await response.json();
    console.log('Twilio SMS Response status:', response.status);
    console.log('Twilio SMS Response:', result);
    
    if (!response.ok) {
      console.error('Twilio SMS failed:', result);
      throw new Error(result.message || 'Failed to send SMS');
    }
    
    return true;
  } catch (error) {
    console.error('SMS sending failed:', error);
    throw error;
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, action, code }: SendSMSRequest = await req.json();

    if (!phone) {
      throw new Error('Phone number is required');
    }

    // Clean phone number (remove spaces, add country code if missing)
    const cleanPhone = phone.replace(/\s/g, '');
    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;

    if (action === 'send_verification') {
      const verificationCode = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // For new users during signup, create a temporary record
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('phone', formattedPhone)
        .single();

      if (!existingUser) {
        // Store verification code in a separate table (upsert to handle duplicates)
        const { error: upsertError } = await supabase
          .from('phone_verifications')
          .upsert({
            phone: formattedPhone,
            verification_code: verificationCode,
            expires_at: expiresAt.toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'phone'
          });

        if (upsertError) {
          console.error('Phone verification upsert error:', upsertError);
          throw new Error('Failed to store verification code');
        }
      } else {
        // Update existing user with verification code
        const { error: dbError } = await supabase
          .from('users')
          .update({
            phone_verification_code: verificationCode,
            phone_verification_expires: expiresAt.toISOString(),
          })
          .eq('phone', formattedPhone);

        if (dbError) {
          console.error('Database error:', dbError);
          throw new Error('Failed to store verification code');
        }
      }

      // Send SMS
      const message = `Your FindWhoSabi verification code is: ${verificationCode}. Valid for 10 minutes.`;
      const smsSent = await sendSMS(formattedPhone, message);

      if (!smsSent) {
        throw new Error('Failed to send SMS');
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

      // Check existing user or phone verification record
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
          console.log('Phone verification lookup failed:', phoneError);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Verification code not found or expired. Please request a new code.' 
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 404 
            }
          );
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

      if (verificationData.phone_verification_code !== code) {
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
    console.error('SMS function error:', error);
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