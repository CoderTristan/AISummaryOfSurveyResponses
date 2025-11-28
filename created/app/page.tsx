import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Zap, FileText, CheckCircle2, Mic } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 min-h-[600px] flex items-center overflow-hidden">
        <div className="container mx-auto relative z-10">
          <div className="max-w-3xl animate-fade-in-up">
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Get <span className="text-blue-500">Instant Feedback</span> with OneQ Surveys
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Quickly gather insights from your audience with simple surveys that take seconds to complete.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/sign-up">
                <Button size="lg" className="group bg-blue-500 hover:bg-blue-400 text-white">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/overview">
                <Button size="lg" variant="outline">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose OneQ Surveys?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Simplified survey experience that helps you understand your audience instantly.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Zap, title: "Fast Setup", description: "Create a survey in seconds and start collecting responses immediately." },
              { icon: FileText, title: "Easy to Analyze", description: "Responses are simple and concise, making analysis a breeze." },
              { icon: Mic, title: "User-Friendly", description: "Respondents enjoy answering a single focused question." },
              { icon: CheckCircle2, title: "Actionable Insights", description: "Quickly identify trends and take action based on results." },
            ].map((feature, index) => (
              <Card
                key={index}
                className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-card border-border/50"
              >
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">See Your Results Instantly</h2>
            <p className="text-xl text-muted-foreground">
              All responses are neatly organized in a clean, intuitive dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-blue-300 to-white text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Start Gathering Insights?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Launch your first one-question survey and discover what your audience thinks—instantly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up">
              <Button size="lg" className="group bg-blue-500 hover:bg-blue-400 text-white">
                Start Your Survey
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="border-white text-blue-600 hover:bg-white hover:text-blue-500">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
