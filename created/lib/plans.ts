export const PLANS = [
{
name: 'Free',
slug: 'free',
price: { monthly: 0 },
features: ['1 Project', '1 Survey', '100 Responses/Month', '100 AI Generation Tokens'],
stripePriceId: null,
},
{
name: 'Pro',
slug: 'pro',
price: { monthly: 12 },
features: ['All Free Tier Features', '10 Projects', '10 Surveys', '1,000 Responses/Month', "Email Summaries", '4,000 AI Generation Tokens'],
stripePriceId: 'price_1SXkDUQybpDxd0p1uIaLwl7d',
},
{
name: 'Premium',
slug: 'premium',
price: { monthly: 29 },
features: ['All Pro Tier Features', '100 Projects', '100 Surveys', '10,000 Responses/Month', '10,000 AI Generation Tokens'],
stripePriceId: 'price_1SXkCqQybpDxd0p1uCkJLpUn',
},
] as const;


export const PLAN_LIMITS = {
free: { projects:1, surveys: 1, responses:100},
pro: { projects:10, surveys: 10, responses:1000 },
premium: { projects:100, surveys: 100, responses:10000 },
};

export const PLAN_TOKEN_CREDITS: Record<string, number> = {
  pro: 4000,
  premium: 10000,
};

export const PLANS_RANKED = [
  { name: 'free', stripePriceId: null, rank: 0 },
  { name: 'pro', stripePriceId: 'price_1SXkDUQybpDxd0p1uIaLwl7d', rank: 1 },
  { name: 'premium', stripePriceId: 'price_1SXkCqQybpDxd0p1uCkJLpUn', rank: 2 },
];
