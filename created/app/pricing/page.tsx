import { CheckoutButton } from '@/components/CheckoutButton';
import { PLANS } from '@/lib/plans';
import { currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export default async function PricingPage() {
  const user = await currentUser();
  let currentPlanSlug: string | null = null;

  if (user) {
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .select('plan_name, status')
      .eq('clerk_id', user.id)
      .eq('status', 'active')
      .single();

    if (error) console.error('Error fetching subscription:', error);
    if (data) {
      const plan = PLANS.find((p) => p.name === data.plan_name);
      currentPlanSlug = plan?.slug || null;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-8">
      <h1 className="text-4xl font-bold mb-12 text-center">Pricing Plans</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {PLANS.map((plan) => {
          const isCurrent = plan.slug === currentPlanSlug;

          return (
            <div
              key={plan.slug}
              className={`border rounded-xl shadow-lg p-8 flex flex-col justify-between bg-white relative ${
                isCurrent ? 'border-green-500' : 'border-gray-300'
              }`}
            >
              <div>
                <h2 className="text-2xl font-semibold flex items-center gap-2 mb-4">
                  {plan.name}
                  {isCurrent && (
                    <span className="text-sm text-green-600 font-medium">
                      (Current)
                    </span>
                  )}
                </h2>

                <p className="text-3xl font-bold mb-6">${plan.price.monthly}/mo</p>

                <ul className="list-disc pl-5 space-y-2 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </div>

              <CheckoutButton
                priceId={plan.stripePriceId!}
                isLoggedIn={!!user}
                planName={plan.name}
                disabledButton={isCurrent}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
