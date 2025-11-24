'use client';

import { createSubscriptionCheckout } from '@/app/actions/subscription.actions';
import { useTransition } from 'react';

type Props = {
	priceId: string;
	isLoggedIn: boolean;
	planName: string;
};

export function CheckoutButton({ priceId, isLoggedIn, planName }: Props) {
	const [isPending, startTransition] = useTransition();

	const handleSubmit = () => {
		if (!isLoggedIn) return alert('Please sign in to subscribe.');

		startTransition(async () => {
			try {
				await createSubscriptionCheckout(priceId);
			} catch (error) {
				alert((error as Error).message);
			}
		});
	};

	return (
		<form action={handleSubmit}>
			<button
				type="submit"
				disabled={isPending}
				className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
			>
				{isPending ? 'Loading...' : `Get ${planName}`}
			</button>
		</form>
	);
}