import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { ManageSubscriptionButton } from '@/components/ManageSubscriptionButton';

export default async function SubscriptionsPage() {
	const { userId } = await auth();
	if (!userId) return null;

	const { data: subscription } = await supabaseAdmin
		.from('subscriptions')
		.select('status, plan_name, current_period_end')
		.eq('clerk_id', userId)
		.single();

	const isActive = subscription?.status === 'active';
	const renewsOn = subscription?.current_period_end
		? new Date(subscription.current_period_end).toLocaleDateString()
		: null;

	return (
		<div className="p-8">
			<h1 className="text-3xl font-bold mb-6">Dashboard</h1>

			{isActive ? (
				<div className="bg-green-50 border border-green-300 p-4 rounded">
					<p>
						✅ You are on the <strong>{subscription.plan_name}</strong> plan.
					</p>
					<p>Renews on: {renewsOn}</p>
					<ManageSubscriptionButton />
				</div>
			) : (
				<div className="bg-gray-50 border border-gray-300 p-4 rounded">
					<p>You are on the Free plan.</p>
					<a href="/pricing" className="text-blue-600 underline">
						Upgrade to Pro →
					</a>
				</div>
			)}
		</div>
	);
}