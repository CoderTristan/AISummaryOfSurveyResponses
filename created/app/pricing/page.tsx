import { CheckoutButton } from '@/components/CheckoutButton';
import { PLANS } from '@/lib/plans';
import { currentUser } from '@clerk/nextjs/server';

export default async function PricingPage() {
	const user = await currentUser();

	return (
		<div className="p-8">
			<h1 className="text-3xl font-bold mb-6">Pricing</h1>

			<div className="flex gap-4">
				{PLANS.map((plan) => (
					<div
						key={plan.slug}
						className="border border-gray-300 p-4 rounded-lg shadow-sm"
					>
						<h2 className="text-xl font-semibold">{plan.name}</h2>
						<p className="text-lg">${plan.price.monthly}/mo</p>
						<ul className="list-disc pl-5 my-3">
							{plan.features.map((feature) => (
								<li key={feature}>{feature}</li>
							))}
						</ul>

						{plan.slug !== 'free' && (
							<CheckoutButton
								priceId={plan.stripePriceId!}
								isLoggedIn={!!user}
								planName={plan.name}
							/>
						)}
					</div>
				))}
			</div>
		</div>
	);
}