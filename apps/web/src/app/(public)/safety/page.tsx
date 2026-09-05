import { ShieldCheck, Lock, PhoneCall, Users, Eye, FileCheck } from 'lucide-react';
import { FadeIn } from '../../../components/motion/fade-in';

const FEATURES = [
  { icon: ShieldCheck, title: 'Identity verification', body: 'Providers can verify their identity with our team before their profile goes live.' },
  { icon: FileCheck, title: 'Voluntary health verification', body: 'Providers may complete a voluntary health verification, shown as a simple status and date — never medical details.' },
  { icon: Lock, title: 'Privacy by design', body: 'Exact addresses are never published. Location is only shared once a booking is confirmed.' },
  { icon: PhoneCall, title: 'Emergency assistance', body: 'Raise an emergency alert at any time — our safety team is notified immediately.' },
  { icon: Users, title: 'Trusted contacts', body: 'Share your booking details with a trusted contact for extra peace of mind.' },
  { icon: Eye, title: 'Check-in / check-out', body: 'Confirm arrival and departure for every booking, creating a clear safety record.' },
];

export default function SafetyPage() {
  return (
    <div className="container py-20">
      <FadeIn>
        <p className="text-xs uppercase tracking-widest text-gold-400/80">Safety & privacy</p>
        <h1 className="mt-2 max-w-2xl font-display text-4xl text-cream-50 md:text-5xl">
          Built for consenting adults, designed for safety
        </h1>
        <p className="mt-4 max-w-2xl text-cream-300/70">
          Near By exists to give independent providers and their clients a safer, more transparent
          way to connect. Every feature below is designed with privacy and consent at the center.
        </p>
      </FadeIn>

      <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <FadeIn key={f.title} delay={i * 0.05}>
            <div className="h-full rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
              <f.icon className="h-6 w-6 text-gold-400" />
              <h3 className="mt-4 font-display text-lg text-cream-50">{f.title}</h3>
              <p className="mt-2 text-sm text-cream-300/70">{f.body}</p>
            </div>
          </FadeIn>
        ))}
      </div>

      <FadeIn delay={0.2}>
        <div className="mt-16 rounded-2xl border border-gold-500/20 bg-gold-500/[0.04] p-6 text-sm text-cream-300/80">
          Health verification reflects a completed voluntary check at a point in time. It is not a
          guarantee of current health status, and no verification on Near By should be treated as
          such. All users are expected to make their own informed decisions.
        </div>
      </FadeIn>
    </div>
  );
}
