import { CheckCircle2, BarChart3, Timer, MousePointerClick } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Features() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="pt-32 pb-20 px-4 text-center">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-blue-500 text-transparent bg-clip-text">
          What is OneQ?
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          OneQ lets you create simple, one-question surveys that deliver instant,
          feedback and insights. No confusing forms, just quick answers.
        </p>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto text-center mb-14">
          <h2 className="text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-gray-600 text-lg max-w-xl mx-auto">
            Create a question, share the link or embed the code, and watch responses appear in your dashboard instantly.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            {
              icon: MousePointerClick,
              title: "Create a OneQ",
              description: "Write a single, focused question in under 10 seconds.",
            },
            {
              icon: Timer,
              title: "Share Instantly",
              description: "Send the link to email, socials, or embed it.",
            },
            {
              icon: BarChart3,
              title: "See Results Live",
              description: "Watch responses update live in a clean dashboard and check out the ai summaries and recommended actions.",
            },
          ].map((step, idx) => (
            <Card key={idx} className="p-8 text-center hover:shadow-lg transition">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mx-auto mb-6">
                <step.icon className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center mb-14">
          <h2 className="text-4xl font-bold mb-4">Why People Use OneQ</h2>
          <p className="text-gray-600 text-lg max-w-xl mx-auto">
            OneQ is built for creators and businesses that want fast feedback on their product or sevice. 
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            "Takes seconds to answer; super high completion rates",
            "Perfect for quick decisions or testing ideas",
            "Clean and friendly design that looks natural on any platform",
            "Instant analytics with no setup",
            "Perfect for polls, feedback, product ideas, or micro-surveys",
          ].map((text, i) => (
            <div key={i} className="flex items-start gap-3">
              <CheckCircle2 className="text-blue-500 w-6 h-6 mt-1" />
              <p className="text-gray-700">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-b from-blue-300 to-white text-center">
        <h2 className="text-4xl font-bold text-black mb-4">
          Start Collecting Answers in Minutes
        </h2>

        <p className="text-lg text-black max-w-xl mx-auto mb-10">
          Build your first question, share it, and get responses instantly.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/sign-up">
            <Button size="lg" className="bg-blue-500 hover:bg-blue-400 text-white">
              Get Started Free
            </Button>
          </Link>

          <Link href="/pricing">
            <Button
              size="lg"
              variant="outline"
              className="border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              View Pricing
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
