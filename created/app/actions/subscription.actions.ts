'use server';

import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';


export async function createSubscriptionCheckout(priceId) {
const { userId } = await auth();
if (!userId) throw new Error('Not authenticated');


const { data: user } = await supabaseAdmin
.from('users')
.select('stripe_customer_id')
.eq('clerk_id', userId)
.single();


let stripeCustomerId = user?.stripe_customer_id;


if (!stripeCustomerId) {
const customer = await stripe.customers.create({ metadata: { clerkId: userId } });
stripeCustomerId = customer.id;


await supabaseAdmin
.from('users')
.update({ stripe_customer_id: stripeCustomerId })
.eq('clerk_id', userId);
}


const checkoutSession = await stripe.checkout.sessions.create({
mode: 'subscription',
payment_method_types: ['card'],
customer: stripeCustomerId,
line_items: [{ price: priceId, quantity: 1 }],
success_url: `${process.env.APP_URL}/dashboard/projects?success=true`,
cancel_url: `${process.env.APP_URL}/pricing`,
metadata: { clerkId: userId, priceId },
});


redirect(checkoutSession.url!);
}


export async function redirectToCustomerPortal() {
const { userId } = await auth();
if (!userId) throw new Error('Not authenticated');


const { data } = await supabaseAdmin
.from('users')
.select('stripe_customer_id')
.eq('clerk_id', userId)
.single();


if (!data?.stripe_customer_id) throw new Error('Stripe customer not found.');


const portalSession = await stripe.billingPortal.sessions.create({
customer: data.stripe_customer_id,
return_url: `${process.env.APP_URL}/dashboard/projects`,
});

redirect(portalSession.url)
}