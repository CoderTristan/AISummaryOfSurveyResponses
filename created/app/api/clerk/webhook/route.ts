import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';
import { deleteUserData } from '@/lib/userData';

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(req: Request) {
	if (!WEBHOOK_SECRET) {
		return new Response('Error: CLERK_WEBHOOK_SECRET not set', { status: 500 });
	}

	const headerPayload = headers();
	const svix_id = (await headerPayload).get('svix-id');
	const svix_timestamp = (await headerPayload).get('svix-timestamp');
	const svix_signature = (await headerPayload).get('svix-signature');

	if (!svix_id || !svix_timestamp || !svix_signature) {
		return new Response('Error: Missing svix headers', { status: 400 });
	}

	const payload = await req.json();
	const body = JSON.stringify(payload);
	const wh = new Webhook(WEBHOOK_SECRET);
	let evt: WebhookEvent;

	try {
		evt = wh.verify(body, {
			'svix-id': svix_id,
			'svix-timestamp': svix_timestamp,
			'svix-signature': svix_signature,
		}) as WebhookEvent;
	} catch (err) {
		console.error('Error verifying Clerk webhook:', err);
		return new Response('Error occurred', { status: 400 });
	}

	const eventType = evt.type;

	if (eventType === 'user.created') {
		const { id, email_addresses, first_name, last_name } = evt.data;
		const email = email_addresses[0]?.email_address;
		const balance = 100
		if (!email) return NextResponse.json({ error: 'No email address found' }, { status: 400 });

		const { error } = await supabaseAdmin.from('users').insert({
			clerk_id: id,
			email: email,
			first_name,
			last_name,
			balance: balance,
		});
		if (error) {
			console.error('Error inserting new user to Supabase:', error);
			return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
		}
	}

	if (eventType === 'user.updated') {
		const { id, email_addresses, first_name, last_name } = evt.data;
		const email = email_addresses[0]?.email_address;

		const { error } = await supabaseAdmin.from('users').update({
			email,
			first_name,
			last_name,
		}).eq('clerk_id', id);

		if (error) {
			console.error('Error updating user in Supabase:', error);
			return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
		}
	}

	if (eventType === 'user.deleted') {
  const { id } = evt.data;
  if (!id) return NextResponse.json({ error: 'No user ID provided' }, { status: 400 });

  try {
    await deleteUserData(id);
    return new Response('User and related data deleted successfully', { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response('Failed to delete user data', { status: 500 });
  }
}


	return new Response('User synced successfully', { status: 200 });
}