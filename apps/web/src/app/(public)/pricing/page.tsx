import { FadeIn } from '../../../components/motion/fade-in';
import { Card } from '@near-by/ui';

const SAMPLE = [
  { duration: '30 minutes', price: '₹1,500 – ₹3,000' },
  { duration: '60 minutes', price: '₹2,800 – ₹5,500' },
  { duration: '90 minutes', price: '₹4,000 – ₹7,500' },
  { duration: '120 minutes', price: '₹5,200 – ₹9,500' },
];

export default function PricingPage() {
  return (
    <div className="container py-20">
      <FadeIn>
        <p className="text-xs uppercase tracking-widest text-gold-400/80">Pricing</p>
        <h1 className="mt-2 max-w-2xl font-display text-4xl text-cream-50 md:text-5xl">
          Every provider sets their own price
        </h1>
        <p className="mt-4 max-w-2xl text-cream-300/70">
          Near By doesn&apos;t set prices. Every provider defines their own rates per duration and can
          adjust them at any time. Our pricing intelligence engine only ever suggests changes based
          on real demand — providers always choose whether to accept.
        </p>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card className="mt-12 max-w-2xl p-8">
          <p className="text-xs uppercase tracking-widest text-cream-400/50">Typical ranges across the platform</p>
          <div className="mt-6 space-y-4">
            {SAMPLE.map((row) => (
              <div key={row.duration} className="flex items-center justify-between border-b border-white/5 pb-4">
                <span className="text-cream-200">{row.duration}</span>
                <span className="font-display text-lg text-gold-300">{row.price}</span>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-cream-400/50">
            Actual prices vary by provider, city, and demand. View each provider&apos;s profile for their
            exact, published pricing.
          </p>
        </Card>
      </FadeIn>
    </div>
  );
}
