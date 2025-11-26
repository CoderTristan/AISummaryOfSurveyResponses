'use client';

import { redirectToCustomerPortal } from '@/app/actions/subscription.actions';
import { useTransition } from 'react';

export function ManageSubscriptionButton() {
	const [isPending, startTransition] = useTransition();

	const handleSubmit = () => {
		startTransition(async () => {
			try {
				await redirectToCustomerPortal();
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
				className="mt-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 disabled:opacity-50"
			>
				{isPending ? 'Loading...' : 'Manage Subscription'}
			</button>
			
		</form>
	);
}
