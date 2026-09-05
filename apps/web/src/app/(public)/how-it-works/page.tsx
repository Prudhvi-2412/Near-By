import { CheckCircle2 } from 'lucide-react';
import { FadeIn } from '../../../components/motion/fade-in';

const CUSTOMER_STEPS = [
  'Create an account and confirm you are 18 or older.',
  'Browse verified providers, filter by city, price, and availability.',
  'Choose a duration and request a booking on a real, published price.',
  'Pay securely — your booking is only confirmed once payment is verified.',
  'Meet with confidence, then rate your experience afterwards.',
];

const PROVIDER_STEPS = [
  'Register as a provider and complete identity verification.',
  'Build your profile: photos, bio, services, and pricing tiers.',
  'Set your real-time availability — available now, later, or busy.',
  'Accept or reject booking requests as they come in.',
  'Get paid securely and track your earnings from your dashboard.',
];

export default function HowItWorksPage() {
  return (
    <div className="container py-20">
      <FadeIn>
        <p className="text-xs uppercase tracking-widest text-gold-400/80">How it works</p>
        <h1 className="mt-2 max-w-2xl font-display text-4xl text-cream-50 md:text-5xl">
          A transparent path from browsing to booking
        </h1>
      </FadeIn>

      <div className="mt-16 grid gap-12 lg:grid-cols-2">
        <FadeIn>
          <h2 className="font-display text-2xl text-cream-50">For customers</h2>
          <ul className="mt-6 space-y-4">
            {CUSTOMER_STEPS.map((step) => (
              <li key={step} className="flex gap-3 text-cream-300/80">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold-400" />
                {step}
              </li>
            ))}
          </ul>
        </FadeIn>
        <FadeIn delay={0.1}>
          <h2 className="font-display text-2xl text-cream-50">For providers</h2>
          <ul className="mt-6 space-y-4">
            {PROVIDER_STEPS.map((step) => (
              <li key={step} className="flex gap-3 text-cream-300/80">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold-400" />
                {step}
              </li>
            ))}
          </ul>
        </FadeIn>
      </div>
    </div>
  );
}
