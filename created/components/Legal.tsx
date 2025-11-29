"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronUp, Menu } from "lucide-react";

export default function Legal() {
  const tosRef = useRef<HTMLDivElement | null>(null);
  const privacyRef = useRef<HTMLDivElement | null>(null);
  const cookiesRef = useRef<HTMLDivElement | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showTop, setShowTop] = useState(false);
  const [showCookieBanner, setShowCookieBanner] = useState(true);

  const scrollTo = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Back to top visibility
  useEffect(() => {
    const handleScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const acceptCookies = () => setShowCookieBanner(false);

  return (
    <div className="min-h-screen flex bg-background relative mt-10">
      {/* Toggle Button */}
      <button
        onClick={() => setSidebarOpen((prev) => !prev)}
        className="md:hidden fixed top-4 left-4 z-50 bg-accent px-3 py-2 rounded shadow border border-border flex items-center gap-2"
      >
        <Menu className="w-5 h-5" />
        Legal
      </button>

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 w-64 border-r border-border p-6 md:static top-0 left-0 h-full bg-background z-40`}
      >
        <h2 className="font-semibold text-lg mb-4">Legal Documents</h2>
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
          <button
            onClick={() => scrollTo(cookiesRef)}
            className="block w-full text-left px-3 py-2 rounded hover:bg-accent transition"
          >
            Cookie Policy
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 mt-4 md:mt-0 space-y-32 md:ml-64">
        {/* TOS */}
        <section ref={tosRef} id="tos">
          <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground mb-4">Last Updated: November 28, 2025</p>

          <div className="space-y-4 leading-relaxed">
            <p>
              These Terms of Service ("Terms") govern your use of OneQ ("the Service"), operated by OneQ ("we", "us", or "our"). By accessing or using the Service, you agree to be bound by these Terms.
            </p>

            <h2 className="text-xl font-semibold">1. Overview</h2>
            <p>
              OneQ provides tools for creating one-question surveys, collecting responses, generating AI insights, and analyzing results.
            </p>

            <h2 className="text-xl font-semibold">2. Eligibility & Accounts</h2>
            <p>
              You must be at least 13 years old (or 16+ for EU users). Accounts are authenticated through Clerk. You are responsible for maintaining the security of your credentials.
            </p>

            <h2 className="text-xl font-semibold">3. Subscriptions & Billing</h2>
            <p>
              Paid plans are billed through Stripe. Subscriptions renew automatically unless canceled. Plan details and pricing are available at <a href="/pricing" className="text-blue-600 underline">/pricing</a>.
            </p>

            <h2 className="text-xl font-semibold">4. Token Credits</h2>
            <p>
              Certain plans include token credits used for AI summaries. Credits have no cash value, may not roll over, and are non-refundable.
            </p>

            <h2 className="text-xl font-semibold">5. User Content Rights</h2>
            <p>
              You retain full ownership of all survey content. You grant us a license to process it solely for the purpose of providing the Service.
            </p>

            <h2 className="text-xl font-semibold">6. Acceptable Use</h2>
            <p>
              You may not use the Service to:  
              • Send spam  
              • Collect prohibited personal data  
              • Engage in unlawful or abusive behavior  
            </p>

            <h2 className="text-xl font-semibold">7. Service Modifications</h2>
            <p>
              We may update or discontinue features at any time. We are not liable for changes or downtime.
            </p>

            <h2 className="text-xl font-semibold">8. Termination</h2>
            <p>
              We may suspend or terminate accounts due to violations, non-payment, or fraudulent activity.
            </p>

            <h2 className="text-xl font-semibold">9. Disclaimer of Warranties</h2>
            <p>The Service is provided "as is" without warranties of any kind.</p>

            <h2 className="text-xl font-semibold">10. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, our liability is limited to the amount paid for the Service in the preceding 12 months.
            </p>

            <h2 className="text-xl font-semibold">11. Governing Law</h2>
            <p>
              These Terms are governed by the laws of the State of Michigan. Any disputes will be resolved in the courts located in Michigan.
            </p>
          </div>
        </section>

        {/* PRIVACY */}
        <section ref={privacyRef} id="privacy">
          <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground mb-4">Last Updated: November 28, 2025</p>

          <div className="space-y-4 leading-relaxed">
            <p>
              This Privacy Policy explains how we collect, use, store, and protect your information when you use OneQ. We are committed to GDPR compliance for EU users.
            </p>

            <h2 className="text-xl font-semibold">1. Information We Collect</h2>
            <p>
              • Account information via Clerk (name, email)  
              • Survey data and responses  
              • Payment data via Stripe  
              • Usage analytics and device information
            </p>

            <h2 className="text-xl font-semibold">2. Legal Basis & Use</h2>
            <p>
              For EU users, our legal bases for processing personal data include:  
              • Contract: providing the Service  
              • Consent: for analytics and AI processing  
              • Legitimate interest: service improvement and fraud prevention  
            </p>

            <h2 className="text-xl font-semibold">3. Data Sharing</h2>
            <p>
              Data is shared only with essential processors:  
              <a href="https://clerk.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Clerk</a> (authentication),  
              <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Stripe</a> (billing),  
              <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Supabase</a> (database), and  
              <a href="https://developers.google.com/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Gemini</a> (AI processing).
            </p>

            <h2 className="text-xl font-semibold">4. Data Transfers</h2>
            <p>
              Data may be transferred to countries outside the EU. We implement safeguards such as Standard Contractual Clauses to ensure adequate protection.
            </p>

            <h2 className="text-xl font-semibold">5. Data Retention</h2>
            <p>
              We retain information for as long as your account is active or as needed to provide the Service.
            </p>

            <h2 className="text-xl font-semibold">6. User Rights (EU)</h2>
            <p>
              EU users have the right to access, correct, erase, or port personal data, restrict processing, and object to data use. To exercise these rights, contact us at <a href="mailto:oneqsurvey@outlook.com" className="text-blue-600 underline">oneqsurvey@outlook.com</a>.
            </p>

            <h2 className="text-xl font-semibold">7. Data Security</h2>
            <p>
              We use industry-standard encryption and security practices, but no system is 100% secure.
            </p>

            <h2 className="text-xl font-semibold">8. Children's Privacy</h2>
            <p>
              The Service is not intended for children under 13 (16+ in the EU). We do not knowingly collect personal data from children without parental consent.
            </p>

            <h2 className="text-xl font-semibold">9. Contact</h2>
            <p>Email: <a href="mailto:oneqsurvey@outlook.com" className="text-blue-600 underline">oneqsurvey@outlook.com</a></p>
          </div>
        </section>

        {/* COOKIES */}
        <section ref={cookiesRef} id="cookies">
          <h1 className="text-3xl font-bold mb-4">Cookie Policy</h1>
          <p className="text-muted-foreground mb-4">Last Updated: November 28, 2025</p>

          <div className="space-y-4 leading-relaxed">
            <p>
              This Cookie Policy explains how OneQ uses cookies and similar technologies.
            </p>

            <h2 className="text-xl font-semibold">1. What Cookies We Use</h2>
            <p>
              • Authentication cookies (Clerk)  
              • Session cookies  
              • Analytics cookies  
              • Preference cookies  
            </p>

            <h2 className="text-xl font-semibold">2. Why We Use Cookies</h2>
            <p>
              • To keep users logged in  
              • To improve performance  
              • To analyze usage  
              • To remember preferences
            </p>

            <h2 className="text-xl font-semibold">3. Cookie Consent</h2>
            <p>
              Non-essential cookies are set only after user consent. You may manage or revoke consent through our cookie banner or your browser settings.
            </p>

            <h2 className="text-xl font-semibold">4. Managing Cookies</h2>
            <p>
              You can disable cookies in your browser settings. Some Service features may not function properly without required cookies.
            </p>
          </div>
        </section>
      </main>

      {/* Back to Top */}
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 bg-blue-500 hover:bg-blue-400 text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2"
        >
          Back to Top <ChevronUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
