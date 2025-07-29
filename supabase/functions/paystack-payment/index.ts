import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  amount: number;
  currency: string;
  tx_ref: string;
  customer: {
    email: string;
    name: string;
    phone_number?: string;
  };
  plan: string;
}

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');

// Validate environment variables
if (!supabaseUrl || !supabaseServiceKey || !paystackSecretKey) {
  console.error('Missing required environment variables:', {
    supabaseUrl: !!supabaseUrl,
    supabaseServiceKey: !!supabaseServiceKey,
    paystackSecretKey: !!paystackSecretKey
  });
}

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check environment variables first
    if (!paystackSecretKey) {
      throw new Error('Paystack secret key not configured');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { 
      amount,
      currency, 
      tx_ref,
      customer,
      plan
    }: PaymentRequest = await req.json();

    if (!amount || !currency || !tx_ref || !customer || !plan) {
      throw new Error('Missing required fields');
    }

    // Get user profile to determine user type
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      throw new Error('User profile not found');
    }

    // Get pricing for the plan, currency, and user type
    const { data: pricing, error: pricingError } = await supabase
      .from('subscription_pricing')
      .select('price')
      .eq('plan', plan)
      .eq('currency_code', currency)
      .eq('user_type', userProfile.user_type)
      .single();

    if (pricingError || !pricing) {
      throw new Error('Plan pricing not found for selected currency');
    }

    // Get currency info
    const { data: currencyInfo, error: currencyError } = await supabase
      .from('currencies')
      .select('name, symbol')
      .eq('code', currency)
      .single();

    if (currencyError || !currencyInfo) {
      throw new Error('Currency not supported');
    }

    // Only allow NGN for Paystack (most stable setup)
    if (currency !== 'NGN') {
      throw new Error('Currently only Nigerian Naira (NGN) is supported for payments');
    }

    // Convert amount to lowest currency unit (kobo for NGN)
    const amountInSubunit = amount * 100;

    // Prepare Paystack payment payload
    // For phone-authenticated users, use a valid fallback email for Paystack
    const validEmail = customer.email.includes('@phoneauth.local') 
      ? `user+${user.id.substring(0, 8)}@findwhosabi.com`
      : customer.email;

    const paymentPayload = {
      reference: tx_ref,
      amount: amountInSubunit,
      currency: currency,
      email: validEmail,
      callback_url: `${req.headers.get('origin') || supabaseUrl}/payment-success?plan=${plan}&tx_ref=${tx_ref}`,
      metadata: {
        user_id: user.id,
        plan: plan,
        currency: currency,
        customer_name: customer.name,
        phone_number: customer.phone_number || ""
      },
      channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer']
    };

    console.log('Creating Paystack payment with payload:', paymentPayload);
    console.log('Using Paystack secret key (first 10 chars):', paystackSecretKey?.substring(0, 10));

    // Initialize payment with Paystack
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentPayload),
    });

    const paymentData = await paystackResponse.json();
    console.log('Paystack response:', paymentData);

    if (!paystackResponse.ok || !paymentData.status) {
      throw new Error(paymentData.message || 'Failed to initialize payment');
    }

    // Store payment attempt in database for tracking
    const { error: insertError } = await supabase
      .from('payment_attempts')
      .insert({
        user_id: user.id,
        tx_ref,
        plan,
        currency,
        amount: amount,
        status: 'pending',
        payment_link: paymentData.data.authorization_url,
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Failed to store payment attempt:', insertError);
      // Don't throw here, payment link is still valid
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_link: paymentData.data.authorization_url,
        tx_ref,
        amount: amount,
        currency,
        currency_symbol: currencyInfo.symbol,
        access_code: paymentData.data.access_code
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Payment initialization error:', error);
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