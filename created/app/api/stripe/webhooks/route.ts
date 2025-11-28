import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { PLAN_TOKEN_CREDITS, PLANS, PLANS_RANKED } from '@/lib/plans';
import { sendPaymentFailedEmail } from '@/lib/email';
import { getBalance } from '@/lib/userData';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
	const body = await req.text();
	const signature = (await headers()).get('stripe-signature')!;
	let event: Stripe.Event;

	try {
		event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
	} catch (err: any) {
		console.error('❌ Webhook signature verification failed:', err.message);
		return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
	}

	try {
		switch (event.type) {
			case 'checkout.session.completed': {
  const session = event.data.object as Stripe.Checkout.Session;
  if (session.mode === 'subscription') {
    const clerkId = session.metadata?.clerkId;
    const priceId = session.metadata?.priceId;
    const subscriptionId = session.subscription as string;

    if (!clerkId || !priceId) throw new Error('Missing metadata from checkout session');

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const plan = PLANS.find(p => p.stripePriceId === priceId);

    console.log('Upserting subscription:', { clerkId, subscriptionId, priceId, planName: plan?.name });

      const { error } = await supabaseAdmin
      .from('subscriptions')
      .upsert({
        clerk_id: clerkId,
        stripe_subscription_id: subscription.id,
        stripe_price_id: priceId,
        status: subscription.status,
        plan_name: plan?.name || 'Unknown',
        current_period_end: new Date(subscription.current_period_end * 1000),
      });
if (error) console.error('Supabase error:', error);
  if (plan?.name) {
      const tokenCredits = PLAN_TOKEN_CREDITS[plan.name.toLowerCase()] ?? 0;
	  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("id, balance")
    .eq("clerk_id", clerkId)
    .single();
	if (error) throw error
	  const newBalance = user?.balance + tokenCredits
      if (tokenCredits > 0) {
        const { error } = await supabaseAdmin
		.from('users')
		.update({
			balance: newBalance,
		})
		.eq("clerk_id", clerkId)

        if (error) {
            console.error('Failed to credit tokens:', error);
          } else {
			const data2 = await getBalance()
            console.log(`Credited ${tokenCredits} tokens to user ${clerkId} ` + data2?.balance);
          }
      }
    }
  }
  break;
}


			case 'invoice.payment_succeeded': {
  const invoice = event.data.object as Stripe.Invoice;
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) {
    console.warn('No subscription ID on invoice:', invoice.id);
    break;
  }

  // Fetch the subscription from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Update subscription record in Supabase
  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_end: new Date(subscription.current_period_end * 1000),
    })
    .eq('stripe_subscription_id', subscription.id);

  // Find the user and plan to credit tokens
  const { data: subData, error: subError } = await supabaseAdmin
    .from('subscriptions')
    .select('clerk_id, stripe_price_id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (subError || !subData) {
    console.error('Failed to fetch subscription user:', subError);
    break;
  }

  // Handle plan lookup, including free plan
  const plan = PLANS_RANKED.find(p => p.stripePriceId === subData.stripe_price_id) 
               || PLANS_RANKED.find(p => p.rank === 0); // default to free if null

  const tokenCredits = PLAN_TOKEN_CREDITS[plan.name.toLowerCase()] ?? 0;

  if (tokenCredits > 0) {
    // Fetch current user balance
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('balance')
      .eq('clerk_id', subData.clerk_id)
      .single();

    if (userError) {
      console.error('Failed to fetch user balance:', userError);
      break;
    }

    const newBalance = (userData?.balance ?? 0) + tokenCredits;

    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ balance: newBalance })
      .eq('clerk_id', subData.clerk_id);

    if (updateError) console.error('Failed to credit monthly tokens:', updateError);
    else console.log(`Added ${tokenCredits} monthly tokens to user ${subData.clerk_id}`);
  }

  break;
}


			case 'customer.subscription.updated': {
  const subscription = event.data.object as Stripe.Subscription;
  const newPriceId = subscription.items.data[0].price.id;

  // Fetch current subscription record from Supabase
  const { data: currentSub, error: subError } = await supabaseAdmin
    .from('subscriptions')
    .select('clerk_id, stripe_price_id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (subError || !currentSub) {
    console.error('Failed to fetch current subscription:', subError);
    break;
  }

  const oldPlan = PLANS_RANKED.find(p => p.stripePriceId === currentSub.stripe_price_id) 
                  || PLANS_RANKED.find(p => p.rank === 0); // default to free
  const newPlan = PLANS_RANKED.find(p => p.stripePriceId === newPriceId);

  // Update subscription in Supabase
  await supabaseAdmin.from('subscriptions').update({
    status: subscription.status,
    current_period_end: new Date(subscription.current_period_end * 1000),
    stripe_price_id: newPriceId,
    plan_name: newPlan?.name || 'Unknown',
  }).eq('stripe_subscription_id', subscription.id);

  // Only credit tokens if user upgraded to a higher plan
  if (oldPlan.rank < (newPlan?.rank ?? 0)) {
    const tokenCredits = PLAN_TOKEN_CREDITS[newPlan!.name.toLowerCase()] ?? 0;

    if (tokenCredits > 0) {
      // Fetch current user balance
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('balance')
        .eq('clerk_id', currentSub.clerk_id)
        .single();

      if (userError) {
        console.error('Failed to fetch user balance:', userError);
        break;
      }

      const newBalance = (userData?.balance ?? 0) + tokenCredits;

      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ balance: newBalance })
        .eq('clerk_id', currentSub.clerk_id);

      if (updateError) console.error('Failed to credit tokens on upgrade:', updateError);
      else console.log(`Credited ${tokenCredits} tokens to user ${currentSub.clerk_id} on upgrade`);
    }
  }

  break;
}


			case 'customer.subscription.deleted': {
				const subscription = event.data.object as Stripe.Subscription;
				await supabaseAdmin.from('subscriptions').update({ status: 'canceled' }).eq('stripe_subscription_id', subscription.id);
				break;
			}

			case 'invoice.payment_failed': {
				const invoice = event.data.object as Stripe.Invoice;
				const customerEmail = invoice.customer_email as string;
				if (customerEmail) await sendPaymentFailedEmail(customerEmail);
				await supabaseAdmin.from('subscriptions').update({ status: 'past_due' }).eq('stripe_subscription_id', invoice.subscription as string);
				break;
			}

			default:
				console.log(`Unhandled event type: ${event.type}`);
		}
	} catch (error) {
		console.error('Webhook handler failed:', error);
		return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
	}

	return NextResponse.json({ received: true });
}
