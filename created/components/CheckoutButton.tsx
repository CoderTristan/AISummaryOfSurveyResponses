'use client';

import { createSubscriptionCheckout } from '@/app/actions/subscription.actions';
import { useTransition } from 'react';

type Props = {
  priceId: string;
  isLoggedIn: boolean;
  planName: string;
  disabledButton?: boolean; // true if the plan is the user's current plan
};

export function CheckoutButton({
  priceId,
  isLoggedIn,
  planName,
  disabledButton = false,
}: Props) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!isLoggedIn) return alert('Please sign in to subscribe.');
    if (disabledButton) return; // prevent clicking if disabled

    startTransition(async () => {
      try {
        await createSubscriptionCheckout(priceId);
      } catch (error) {
        alert((error as Error).message);
      }
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <button
        type="submit"
        disabled={isPending || disabledButton}
        className={`mt-3 px-4 py-2 rounded text-white ${
          disabledButton
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        } disabled:opacity-50`}
      >
        {isPending
          ? 'Loading...'
          : disabledButton
          ? 'Current Plan'
          : `Get ${planName}`}
      </button>
    </form>
  );
}
