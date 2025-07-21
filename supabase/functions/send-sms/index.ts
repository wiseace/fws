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

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const termiiApiKey = Deno.env.get('TERMII_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendSMS = async (phone: string, message: string): Promise<boolean> => {
  try {
    // Use TERMII test mode for now
    const response = await fetch('https://v3.termii.com/api/sms/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: phone,
        from: "FindWhoSabi",
        sms: message,
        type: "plain",
        channel: "generic",
        api_key: termiiApiKey,
      }),
    });

    const result = await response.json();
    console.log('TERMII SMS Response:', result);
    
    return response.ok && result.message_id;
  } catch (error) {
    console.error('SMS sending failed:', error);
    return false;
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

      // Store verification code in database
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

      // Verify code from database
      const { data: user, error } = await supabase
        .from('users')
        .select('phone_verification_code, phone_verification_expires')
        .eq('phone', formattedPhone)
        .single();

      if (error || !user) {
        throw new Error('User not found');
      }

      const now = new Date();
      const expiresAt = new Date(user.phone_verification_expires);

      if (now > expiresAt) {
        throw new Error('Verification code has expired');
      }

      if (user.phone_verification_code !== code) {
        throw new Error('Invalid verification code');
      }

      // Mark phone as verified and clear verification data
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