import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/survey(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  const session = await auth();     // MUST await this — returns SessionAuth

  if (isProtectedRoute(req) && !session.userId) {
    return session.redirectToSignIn();   // redirectToSignIn exists on SessionAuth
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
