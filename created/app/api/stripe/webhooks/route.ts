import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { PLANS } from '@/lib/plans';
import { sendPaymentFailedEmail } from '@/lib/email';

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

    await supabaseAdmin
      .from('subscriptions')
      .upsert({
        clerk_id: clerkId,
        stripe_subscription_id: subscription.id,
        stripe_price_id: priceId,
        status: subscription.status,
        plan_name: plan?.name || 'Unknown',
        current_period_end: new Date(subscription.current_period_end * 1000),
      });
  }
  break;
}


			case 'invoice.payment_succeeded': {
				const invoice = event.data.object as Stripe.Invoice;
				const subscriptionId = invoice.subscription as string;
				const subscription = await stripe.subscriptions.retrieve(subscriptionId);

				await supabaseAdmin.from('subscriptions').update({
					status: subscription.status,
					current_period_end: new Date(subscription.current_period_end * 1000),
				}).eq('stripe_subscription_id', subscription.id);
				break;
			}

			case 'customer.subscription.updated': {
				const subscription = event.data.object as Stripe.Subscription;
				const newPriceId = subscription.items.data[0].price.id;
				const plan = PLANS.find(p => p.stripePriceId === newPriceId);

				await supabaseAdmin.from('subscriptions').update({
					status: subscription.status,
					current_period_end: new Date(subscription.current_period_end * 1000),
					stripe_price_id: newPriceId,
					plan_name: plan?.name || 'Unknown',
				}).eq('stripe_subscription_id', subscription.id);
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
