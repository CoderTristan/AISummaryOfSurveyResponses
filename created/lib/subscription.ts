import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { PLAN_LIMITS } from '@/lib/plans';

type SubscriptionStatus = {
	plan: string;
	status: string;
	limits: {
		surveys: number;
	};
};

export async function checkSubscription(): Promise<SubscriptionStatus> {
	const { userId } = await auth();

	if (!userId) {
		return { plan: 'Free', status: 'inactive', limits: PLAN_LIMITS.free };
	}

	const { data: subscription } = await supabaseAdmin
		.from('subscriptions')
		.select('plan_name, status')
		.eq('clerk_id', userId)
		.single();

	if (!subscription || subscription.status !== 'active') {
		return { plan: 'Free', status: 'inactive', limits: PLAN_LIMITS.free };
	}

	const planSlug = subscription.plan_name.toLowerCase();
	const limits = PLAN_LIMITS[planSlug as keyof typeof PLAN_LIMITS] || PLAN_LIMITS.free;

	return {
		plan: subscription.plan_name,
		status: subscription.status,
		limits,
	};
}
