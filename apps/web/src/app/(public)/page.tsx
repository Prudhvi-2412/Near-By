import Link from 'next/link';
import { ArrowRight, Lock, Sparkles, ShieldCheck, Clock, Wallet, Star } from 'lucide-react';
import { Button } from '@near-by/ui';
import { CinematicGlow } from '../../components/visuals/cinematic-glow';
import { FadeIn } from '../../components/motion/fade-in';
import { ProviderCard } from '../../components/provider/provider-card';
import { serverGet } from '../../lib/server-fetch';
import type { ExploreResponse } from '../../types/provider';

const HOW_IT_WORKS = [
  {
    title: 'Explore verified providers',
    body: 'Browse detailed profiles with transparent pricing, availability, and ratings — no guesswork.',
  },
  {
    title: 'Book on your terms',
    body: 'Choose a duration, confirm the price, and request a booking in a few taps.',
  },
  {
    title: 'Pay securely, meet with confidence',
    body: 'Payment is verified before confirmation, and every booking is backed by our safety tools.',
  },
];

const TRUST_POINTS = [
  { icon: ShieldCheck, title: 'Identity verification', body: 'Providers can complete identity checks reviewed by our team.' },
  { icon: Lock, title: 'Privacy by design', body: 'No exact addresses or private details are ever shown publicly.' },
  { icon: Clock, title: 'Real-time availability', body: 'See who is available now — no back-and-forth messaging required.' },
  { icon: Wallet, title: 'Worker-controlled pricing', body: 'Providers set and adjust their own rates — always visible upfront.' },
];

export default async function LandingPage() {
  const featured = await serverGet<ExploreResponse>('/providers?sortBy=rating&pageSize=3', {
    items: [],
    total: 0,
    page: 1,
    pageSize: 3,
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden pb-32 pt-24 md:pt-36">
        <CinematicGlow />
        <div className="container relative z-10 max-w-4xl text-center">
          <FadeIn>
            <span className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 text-xs uppercase tracking-widest text-gold-300">
              <Sparkles className="h-3.5 w-3.5" /> A premium marketplace, reimagined
            </span>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h1 className="mt-8 font-display text-5xl leading-tight text-cream-50 md:text-7xl">
              Your time. Your terms.
              <br />
              <span className="text-gradient-gold">Your Near By.</span>
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-cream-300/70">
              A premium marketplace built around choice, privacy, and trusted connections between
              verified independent providers and consenting adults.
            </p>
          </FadeIn>
          <FadeIn delay={0.3}>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" variant="primary">
                <Link href="/explore">
                  Explore Near By <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/register">Become a Provider</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Featured providers */}
      {featured.items.length > 0 && (
        <section className="container py-24">
          <FadeIn>
            <div className="mb-12 flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-gold-400/80">Featured</p>
                <h2 className="mt-2 font-display text-3xl text-cream-50 md:text-4xl">Highly rated, right now</h2>
              </div>
              <Button asChild variant="link">
                <Link href="/explore">
                  View all <ArrowRight className="ml-1 inline h-4 w-4" />
                </Link>
              </Button>
            </div>
          </FadeIn>
          <div className="grid gap-6 md:grid-cols-3">
            {featured.items.map((p, i) => (
              <FadeIn key={p.id} delay={i * 0.1}>
                <ProviderCard provider={p} />
              </FadeIn>
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="border-y border-white/[0.06] bg-white/[0.015] py-24">
        <div className="container">
          <FadeIn>
            <p className="text-center text-xs uppercase tracking-widest text-gold-400/80">How Near By works</p>
            <h2 className="mx-auto mt-2 max-w-2xl text-center font-display text-3xl text-cream-50 md:text-4xl">
              Three steps to a confident booking
            </h2>
          </FadeIn>
          <div className="mt-16 grid gap-10 md:grid-cols-3">
            {HOW_IT_WORKS.map((step, i) => (
              <FadeIn key={step.title} delay={i * 0.1}>
                <div className="relative pl-16">
                  <span className="absolute left-0 top-0 flex h-11 w-11 items-center justify-center rounded-full border border-gold-500/30 bg-gold-500/10 font-display text-lg text-gold-300">
                    {i + 1}
                  </span>
                  <h3 className="font-display text-xl text-cream-50">{step.title}</h3>
                  <p className="mt-2 text-sm text-cream-300/70">{step.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Worker-controlled pricing */}
      <section className="container py-24">
        <div className="grid items-center gap-16 md:grid-cols-2">
          <FadeIn>
            <p className="text-xs uppercase tracking-widest text-gold-400/80">Worker-controlled pricing</p>
            <h2 className="mt-2 font-display text-3xl text-cream-50 md:text-4xl">
              Providers set their own rates — always.
            </h2>
            <p className="mt-4 text-cream-300/70">
              Every provider defines their own pricing tiers by duration and can update them any
              time. Our pricing intelligence engine only ever suggests adjustments based on real
              demand — providers always have the final say.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-cream-200">
              {['Set base prices per duration', 'Update pricing anytime', 'See demand-based suggestions', 'Full pricing history'].map(
                (item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Star className="h-3.5 w-3.5 text-gold-400" /> {item}
                  </li>
                ),
              )}
            </ul>
          </FadeIn>
          <FadeIn delay={0.15}>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-8">
              <p className="mb-6 text-xs uppercase tracking-widest text-cream-400/50">Sample pricing</p>
              <div className="space-y-4">
                {[
                  { duration: '30 minutes', price: '₹2,500' },
                  { duration: '60 minutes', price: '₹4,600' },
                  { duration: '90 minutes', price: '₹6,500' },
                  { duration: '120 minutes', price: '₹8,200' },
                ].map((row) => (
                  <div key={row.duration} className="flex items-center justify-between border-b border-white/5 pb-3">
                    <span className="text-cream-300/80">{row.duration}</span>
                    <span className="font-display text-lg text-gold-300">{row.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Trust & privacy */}
      <section className="border-y border-white/[0.06] bg-white/[0.015] py-24">
        <div className="container">
          <FadeIn>
            <p className="text-center text-xs uppercase tracking-widest text-gold-400/80">Trust & privacy</p>
            <h2 className="mx-auto mt-2 max-w-2xl text-center font-display text-3xl text-cream-50 md:text-4xl">
              A premium experience, built on safety
            </h2>
          </FadeIn>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {TRUST_POINTS.map((point, i) => (
              <FadeIn key={point.title} delay={i * 0.1}>
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
                  <point.icon className="h-6 w-6 text-gold-400" />
                  <h3 className="mt-4 font-display text-lg text-cream-50">{point.title}</h3>
                  <p className="mt-2 text-sm text-cream-300/70">{point.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-28">
        <CinematicGlow />
        <div className="container relative z-10 text-center">
          <FadeIn>
            <h2 className="font-display text-3xl text-cream-50 md:text-5xl">Ready to find your Near By?</h2>
            <p className="mx-auto mt-4 max-w-xl text-cream-300/70">
              Join a marketplace built on choice, privacy, and trust — for providers and customers alike.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" variant="primary">
                <Link href="/explore">Explore Near By</Link>
              </Button>
              <Button asChild size="lg" variant="gold">
                <Link href="/register">Become a Provider</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
