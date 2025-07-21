import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  plan: string;
  currency: string;
  customer_email: string;
  customer_name: string;
  customer_phone?: string;
  redirect_url: string;
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const flutterwaveClientId = Deno.env.get('FLUTTERWAVE_CLIENT_ID')!;
const flutterwaveSecretKey = Deno.env.get('FLUTTERWAVE_CLIENT_SECRET')!;
const encryptionKey = Deno.env.get('FLUTTERWAVE_ENCRYPTION_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
      plan, 
      currency, 
      customer_email, 
      customer_name, 
      customer_phone,
      redirect_url 
    }: PaymentRequest = await req.json();

    if (!plan || !currency || !customer_email || !customer_name) {
      throw new Error('Missing required fields');
    }

    // Get pricing for the plan and currency
    const { data: pricing, error: pricingError } = await supabase
      .from('subscription_pricing')
      .select('price')
      .eq('plan', plan)
      .eq('currency_code', currency)
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

    // Generate unique transaction reference
    const tx_ref = `FWS_${user.id.substr(0, 8)}_${plan}_${Date.now()}`;

    // Prepare Flutterwave payment payload
    const paymentPayload = {
      tx_ref,
      amount: pricing.price,
      currency,
      redirect_url,
      customer: {
        email: customer_email,
        name: customer_name,
        phonenumber: customer_phone || "",
      },
      customizations: {
        title: "FindWhoSabi Subscription",
        description: `${plan} subscription plan`,
        logo: "https://your-logo-url.com/logo.png"
      },
      meta: {
        user_id: user.id,
        plan: plan,
        currency: currency
      }
    };

    console.log('Creating Flutterwave payment with payload:', paymentPayload);

    // Initialize payment with Flutterwave
    const flutterwaveResponse = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${flutterwaveSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentPayload),
    });

    const paymentData = await flutterwaveResponse.json();
    console.log('Flutterwave response:', paymentData);

    if (!flutterwaveResponse.ok || paymentData.status !== 'success') {
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
        amount: pricing.price,
        status: 'pending',
        payment_link: paymentData.data.link,
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Failed to store payment attempt:', insertError);
      // Don't throw here, payment link is still valid
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_link: paymentData.data.link,
        tx_ref,
        amount: pricing.price,
        currency,
        currency_symbol: currencyInfo.symbol
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