import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Nav";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import Footer from "@/components/Footer";
import PostHogProvider from "@/components/PostHogProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "One Question Surveys",
  description: "Create one question surveys fast and simple. One Question solves the issue of bloated forms tool. It is organized into a clean dashboard with survey previews, custom templates, daily/weekly email summaries, and AI response summaries for maximum efficiency feedback gathering.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-MTF3XR57VW"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-MTF3XR57VW', { page_path: window.location.pathname });
            `,
          }}
        />
      </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          >
          <ClerkProvider>
            <Analytics />
            <SpeedInsights />
          <PostHogProvider>
      <Header />
      {children}
      <Footer />
    </PostHogProvider>
    </ClerkProvider>
        </body>
      </html>
  );
}
