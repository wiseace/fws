import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyPaymentRequest {
  reference: string;
  tx_ref?: string;
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const calculateExpiryDate = (plan: string): string => {
  const now = new Date();
  switch (plan) {
    case 'monthly':
      now.setMonth(now.getMonth() + 1);
      break;
    case 'semi_annual':
      now.setMonth(now.getMonth() + 6);
      break;
    case 'yearly':
      now.setFullYear(now.getFullYear() + 1);
      break;
    default:
      throw new Error('Invalid subscription plan');
  }
  return now.toISOString();
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reference, tx_ref }: VerifyPaymentRequest = await req.json();
    const transactionRef = reference || tx_ref;

    if (!transactionRef) {
      throw new Error('Transaction reference is required');
    }

    console.log('Verifying payment:', { reference: transactionRef });

    // Verify payment with Paystack
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${transactionRef}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
    });

    const verificationData = await verifyResponse.json();
    console.log('Paystack verification response:', verificationData);

    if (!verifyResponse.ok || !verificationData.status) {
      throw new Error('Payment verification failed');
    }

    const payment = verificationData.data;

    // Check if payment was successful
    if (payment.status !== 'success') {
      throw new Error(`Payment status: ${payment.status}`);
    }

    // Verify transaction reference matches
    if (payment.reference !== transactionRef) {
      throw new Error('Transaction reference mismatch');
    }

    // Extract user ID and plan from metadata
    const userId = payment.metadata?.user_id;
    const plan = payment.metadata?.plan;

    if (!userId || !plan) {
      throw new Error('Invalid payment metadata');
    }

    // Calculate subscription expiry
    const subscriptionExpiry = calculateExpiryDate(plan);

    // Update user subscription
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_plan: plan,
        subscription_status: plan,
        subscription_expiry: subscriptionExpiry,
        can_access_contact: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to update user subscription:', updateError);
      throw new Error('Failed to activate subscription');
    }

    // Update payment attempt record
    const { error: paymentUpdateError } = await supabase
      .from('payment_attempts')
      .update({
        status: 'completed',
        transaction_id: payment.id,
        verified_at: new Date().toISOString()
      })
      .eq('tx_ref', transactionRef);

    if (paymentUpdateError) {
      console.error('Failed to update payment record:', paymentUpdateError);
      // Don't throw here, subscription is already activated
    }

    // Create success notification
    const { error: notificationError } = await supabase
      .from('user_notifications')
      .insert({
        user_id: userId,
        title: 'Subscription Activated!',
        message: `Your ${plan} subscription has been activated and will expire on ${new Date(subscriptionExpiry).toLocaleDateString()}.`,
        type: 'success'
      });

    if (notificationError) {
      console.error('Failed to create notification:', notificationError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment verified and subscription activated',
        subscription: {
          plan,
          expiry: subscriptionExpiry,
          amount: payment.amount / 100, // Convert from kobo to naira
          currency: payment.currency
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Payment verification error:', error);
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