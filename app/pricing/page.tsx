"use client";

import { useState } from "react";
import { featureFlags } from "@/lib/featureFlags";
import { redirect } from "next/navigation";

export default function PricingPage() {
  // Redirect if pricing is not enabled
  if (!featureFlags.SHOW_PRICING) {
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    return null;
  }

  const [darkMode, setDarkMode] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");

  const mainClasses = darkMode
    ? "min-h-screen w-full flex flex-col items-center px-6 py-12 dark-gradient text-slate-50"
    : "min-h-screen w-full flex flex-col items-center px-6 py-12 light-gradient text-neutral-900";

  const tiers = [
    {
      name: "Free",
      price: { monthly: 0, annual: 0 },
      description: "Perfect for trying Continuum",
      features: [
        "Unlimited exports",
        "ChatGPT, Claude, Gemini support",
        "Local encryption",
        "Download export files",
        "Community support",
      ],
      limitations: [
        "No cloud backup",
        "No sync across devices",
        "No browser extension",
      ],
      cta: "Get Started",
      ctaLink: "/",
      popular: false,
    },
    {
      name: "Pro",
      price: { monthly: 12, annual: 99 },
      description: "For power users and professionals",
      features: [
        "Everything in Free, plus:",
        "☁️ Cloud backup (encrypted)",
        "🔄 Sync across devices",
        "🔌 Browser extension (coming soon)",
        "📊 Version history",
        "🚀 Advanced export formats",
        "🔑 API access",
        "⚡ Priority support",
        "🆕 Early access to new LLMs",
      ],
      limitations: [],
      cta: "Start Pro Trial",
      ctaLink: "/api/stripe/checkout?tier=pro",
      popular: true,
    },
    {
      name: "Teams",
      price: { monthly: 39, annual: 390 },
      description: "For teams and enterprises",
      perUser: true,
      features: [
        "Everything in Pro, plus:",
        "👥 Team memory profiles",
        "📊 Admin dashboard",
        "🔐 SSO/SAML",
        "🔧 Custom LLM integrations",
        "📞 Dedicated support",
        "📈 Usage analytics",
        "✅ SLA guarantees",
        "🎯 Custom onboarding",
      ],
      limitations: [],
      cta: "Contact Sales",
      ctaLink: "mailto:sales@continuum.ai?subject=Teams%20Inquiry",
      popular: false,
    },
  ];

  return (
    <main className={mainClasses}>
      {/* Header */}
      <header className="w-full max-w-6xl flex flex-col items-center text-center mb-12 animate-fade-in">
        <a href="/" className="mb-8 flex items-center gap-3 hover:opacity-80 transition-smooth">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-xl">
            🧠
          </div>
          <span className="text-2xl font-bold gradient-text">Continuum</span>
        </a>

        <h1 className="text-5xl font-bold mb-4">
          Choose Your Plan
        </h1>
        <p className="text-xl opacity-80 max-w-2xl mb-8">
          Start free. Upgrade when you need cloud backup and sync.
        </p>

        {/* Billing Toggle */}
        <div className={`flex items-center gap-3 ${
          darkMode ? "glass" : "glass-light"
        } rounded-full p-1.5`}>
          <button
            onClick={() => setBillingPeriod("monthly")}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-smooth ${
              billingPeriod === "monthly"
                ? "bg-purple-600 text-white"
                : "hover:bg-white/5"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod("annual")}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-smooth ${
              billingPeriod === "annual"
                ? "bg-purple-600 text-white"
                : "hover:bg-white/5"
            }`}
          >
            Annual
            <span className="ml-2 text-xs opacity-80">(Save 17%)</span>
          </button>
        </div>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`mt-4 px-4 py-2 rounded-full text-sm font-medium transition-smooth ${
            darkMode ? "glass hover:bg-white/10" : "glass-light hover:bg-black/5"
          }`}
        >
          {darkMode ? "☀️ Light" : "🌙 Dark"}
        </button>
      </header>

      {/* Pricing Cards */}
      <section className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {tiers.map((tier) => {
          const price = tier.price[billingPeriod];
          const monthlyPrice = billingPeriod === "annual" ? Math.round(price / 12) : price;

          return (
            <div
              key={tier.name}
              className={`relative rounded-3xl p-8 transition-smooth ${
                tier.popular
                  ? darkMode
                    ? "bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border-2 border-purple-500"
                    : "bg-gradient-to-br from-purple-100 to-indigo-100 border-2 border-purple-400"
                  : darkMode
                  ? "glass"
                  : "glass-light"
              } ${tier.popular ? "hover-glow scale-105" : ""}`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-bold shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                <p className="text-sm opacity-70">{tier.description}</p>
              </div>

              <div className="mb-6">
                {price === 0 ? (
                  <div className="text-4xl font-bold">Free</div>
                ) : (
                  <div>
                    <div className="text-4xl font-bold">
                      ${monthlyPrice}
                      <span className="text-lg opacity-70">
                        /mo{tier.perUser ? "/user" : ""}
                      </span>
                    </div>
                    {billingPeriod === "annual" && (
                      <div className="text-sm opacity-70 mt-1">
                        ${price} billed annually
                      </div>
                    )}
                  </div>
                )}
              </div>

              <a
                href={tier.ctaLink}
                className={`block w-full text-center px-6 py-3 rounded-xl font-medium transition-smooth mb-6 ${
                  tier.popular
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500"
                    : darkMode
                    ? "bg-white/10 hover:bg-white/20"
                    : "bg-black/10 hover:bg-black/20"
                }`}
              >
                {tier.cta}
              </a>

              <div className="space-y-3">
                {tier.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
                {tier.limitations.map((limitation, idx) => (
                  <div key={idx} className="flex items-start gap-2 opacity-50">
                    <span className="mt-0.5">✗</span>
                    <span className="text-sm">{limitation}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* FAQ */}
      <section className={`w-full max-w-4xl ${
        darkMode ? "glass" : "glass-light"
      } rounded-3xl p-8 mb-16`}>
        <h2 className="text-3xl font-bold mb-8 text-center">
          Frequently Asked Questions
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-bold text-lg mb-2">
              Can I switch plans anytime?
            </h3>
            <p className="opacity-80">
              Yes! You can upgrade, downgrade, or cancel anytime. Pro-rated refunds available.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-2">
              What happens to my data if I downgrade?
            </h3>
            <p className="opacity-80">
              Your cloud backups remain accessible for 30 days after downgrade. You can export and save locally before they're deleted.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-2">
              Is my data encrypted?
            </h3>
            <p className="opacity-80">
              Yes! We use zero-knowledge encryption (Argon2id + AES-256-GCM). We cannot read your data, even if we wanted to.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-2">
              Do you offer refunds?
            </h3>
            <p className="opacity-80">
              Yes, we offer a 14-day money-back guarantee on all paid plans. No questions asked.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-2">
              What payment methods do you accept?
            </h3>
            <p className="opacity-80">
              We accept all major credit cards (Visa, Mastercard, Amex) via Stripe. Annual plans can also pay via invoice.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-2">
              What LLMs do you support?
            </h3>
            <p className="opacity-80">
              Currently: ChatGPT, Claude, and Gemini. We're adding more models monthly. Pro users get early access.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center mb-16">
        <h2 className="text-3xl font-bold mb-4">
          Still have questions?
        </h2>
        <p className="text-lg opacity-80 mb-6">
          Chat with our team or check out the docs.
        </p>
        <div className="flex items-center justify-center gap-4">
          <a
            href="mailto:support@continuum.ai"
            className={`px-6 py-3 rounded-xl font-medium transition-smooth ${
              darkMode ? "glass hover:bg-white/10" : "glass-light hover:bg-black/5"
            }`}
          >
            Contact Support
          </a>
          <a
            href="/"
            className="px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 transition-smooth"
          >
            Try It Free
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center opacity-50 text-sm">
        <p>Built with 🧠 for AI context portability</p>
      </footer>
    </main>
  );
}
