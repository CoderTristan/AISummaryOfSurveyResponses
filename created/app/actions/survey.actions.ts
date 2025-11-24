'use server';

import { checkSubscription } from '@/lib/subscription';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

export async function createSurvey(formData: FormData) {
	const { userId } = await auth();
	if (!userId) throw new Error('Not authenticated');

	const question = formData.get('question') as string;
	if (!question) throw new Error('Question is required');

	const { plan, limits } = await checkSubscription();

	const { count, error } = await supabaseAdmin
		.from('surveys')
		.select('*', { count: 'exact', head: true })
		.eq('user_id', userId);

	if (count !== null && count >= limits.surveys) {
		throw new Error(`Your ${plan} plan is limited to ${limits.surveys} survey(s). Please upgrade to create more.`);
	}

	const { error: insertError } = await supabaseAdmin.from('surveys').insert({
		user_id: userId,
		question,
	});

	if (insertError) {
		console.error('Error creating survey:', insertError);
		throw new Error('Could not create survey.');
	}

	revalidatePath('/dashboard');

	return { success: true, question };
}
