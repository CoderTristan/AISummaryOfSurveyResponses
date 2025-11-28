"use client";
import { useRef } from "react";

export default function Legal() {
  const tosRef = useRef<HTMLDivElement | null>(null);
  const privacyRef = useRef<HTMLDivElement | null>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border p-6 sticky top-0 h-screen hidden md:block">
        <h2 className="font-semibold text-lg mb-4">Legal</h2>

        <nav className="space-y-3">
          <button
            onClick={() => scrollTo(tosRef)}
            className="block w-full text-left px-3 py-2 rounded hover:bg-accent transition"
          >
            Terms of Service
          </button>

          <button
            onClick={() => scrollTo(privacyRef)}
            className="block w-full text-left px-3 py-2 rounded hover:bg-accent transition"
          >
            Privacy Policy
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 space-y-32">
        {/* Terms of Service */}
        <section ref={tosRef} id="tos">
          <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground mb-4">
            Last Updated: [Insert Date]
          </p>

          <div className="space-y-4 leading-relaxed">
            <p>
              Welcome to OneQ. By accessing or using the Service, you agree to
              these Terms. If you do not agree, do not use the Service.
            </p>

            <h2 className="text-xl font-semibold">1. Overview</h2>
            <p>
              OneQ provides tools for creating one-question surveys, collecting
              responses, and generating AI summaries.
            </p>

            <h2 className="text-xl font-semibold">2. Accounts</h2>
            <p>
              Accounts are authenticated through Clerk. You are responsible for
              securing your login.
            </p>

            <h2 className="text-xl font-semibold">3. Subscriptions & Billing</h2>
            <p>
              Stripe processes all subscription payments. Subscriptions renew
              automatically unless cancelled.
            </p>

            <h2 className="text-xl font-semibold">4. Token Credits</h2>
            <p>
              Certain plans include token credits for AI summaries. Credits have
              no cash value and may not roll over.
            </p>

            <h2 className="text-xl font-semibold">5. User Content</h2>
            <p>
              You retain ownership of all content. We only process it to provide
              the Service.
            </p>

            <h2 className="text-xl font-semibold">6. Acceptable Use</h2>
            <p>
              You may not use OneQ for spam, prohibited data collection, or
              illegal activity.
            </p>

            <h2 className="text-xl font-semibold">7. Service Availability</h2>
            <p>
              We may update, modify, or discontinue features without liability.
            </p>

            <h2 className="text-xl font-semibold">8. Termination</h2>
            <p>
              Accounts may be suspended for violations or payment failures.
            </p>

            <h2 className="text-xl font-semibold">9. Disclaimers</h2>
            <p>The service is provided “as is” without warranties.</p>

            <h2 className="text-xl font-semibold">10. Limitation of Liability</h2>
            <p>
              Our liability is limited to the amount paid in the last 12 months.
            </p>
          </div>
        </section>

        {/* Privacy Policy */}
        <section ref={privacyRef} id="privacy">
          <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground mb-4">
            Last Updated: [Insert Date]
          </p>

          <div className="space-y-4 leading-relaxed">
            <p>
              This Privacy Policy explains how OneQ collects, stores, and uses
              information.
            </p>

            <h2 className="text-xl font-semibold">1. Information We Collect</h2>
            <p>
              We collect account information (via Clerk), survey data, and usage
              analytics.
            </p>

            <h2 className="text-xl font-semibold">2. How We Use Information</h2>
            <p>
              We use data to provide survey services, generate AI summaries, and
              improve the platform.
            </p>

            <h2 className="text-xl font-semibold">3. Sharing of Data</h2>
            <p>
              We only share data with essential providers such as Supabase,
              Stripe, Clerk, and AI APIs.
            </p>

            <h2 className="text-xl font-semibold">4. Cookies</h2>
            <p>
              Authentication and usage cookies may be used to improve the
              experience.
            </p>

            <h2 className="text-xl font-semibold">5. Data Security</h2>
            <p>
              We use industry-standard security practices but cannot guarantee
              complete protection.
            </p>

            <h2 className="text-xl font-semibold">6. Your Rights</h2>
            <p>
              You may request to delete your data by contacting us or closing
              your account.
            </p>

            <h2 className="text-xl font-semibold">7. Contact</h2>
            <p>Email: [your-email]</p>
          </div>
        </section>
      </main>
    </div>
  );
}
