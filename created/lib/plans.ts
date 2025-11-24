export const PLANS = [
{
name: 'Free',
slug: 'free',
price: { monthly: 0 },
features: ['1 Survey', '10 Responses', 'Basic Analytics'],
stripePriceId: null,
},
{
name: 'Pro',
slug: 'pro',
price: { monthly: 10 },
features: ['10 Surveys', '1,000 Responses', 'Advanced Analytics'],
stripePriceId: 'price_PRO_MONTHLY_ID',
},
{
name: 'Premium',
slug: 'premium',
price: { monthly: 25 },
features: ['Unlimited Surveys', 'Unlimited Responses', 'All Features'],
stripePriceId: 'price_PREMIUM_MONTHLY_ID',
},
] as const;


export const PLAN_LIMITS = {
free: { surveys: 1 },
pro: { surveys: 10 },
premium: { surveys: Infinity },
};