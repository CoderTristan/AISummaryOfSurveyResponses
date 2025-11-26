export const PLANS = [
{
name: 'Free',
slug: 'free',
price: { monthly: 0 },
features: ['1 Project', '1', '100 Responses/Month', ],
stripePriceId: null,
},
{
name: 'Pro',
slug: 'pro',
price: { monthly: 12 },
features: ['All Free Tier Features', '10 Projects', '10 Surveys', '1,000 Responses/Month', 'No Survey Branding', "Email Summaries"],
stripePriceId: 'price_1SWJz6QybpDxd0p14KGxP0r2',
},
{
name: 'Premium',
slug: 'premium',
price: { monthly: 29 },
features: ['All Pro Tier Features', '100 Projects', '100 Surveys', '10,000 Responses/Month', ],
stripePriceId: 'price_1SWJzNQybpDxd0p1rdpAbN54',
},
] as const;


export const PLAN_LIMITS = {
free: { surveys: 1 },
pro: { surveys: 10 },
premium: { surveys: Infinity },
};