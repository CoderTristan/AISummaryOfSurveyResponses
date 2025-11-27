import posthog from 'posthog-js';

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

if (!key || !host) {
  throw new Error("PostHog key or host is missing!");
}

posthog.init(key, {
  api_host: host,
  defaults: '2025-05-24',
});

export default posthog;
