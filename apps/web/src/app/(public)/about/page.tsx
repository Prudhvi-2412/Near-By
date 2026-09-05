import { FadeIn } from '../../../components/motion/fade-in';

export default function AboutPage() {
  return (
    <div className="container max-w-3xl py-20">
      <FadeIn>
        <p className="text-xs uppercase tracking-widest text-gold-400/80">About Near By</p>
        <h1 className="mt-2 font-display text-4xl text-cream-50 md:text-5xl">
          A marketplace built on choice and trust
        </h1>
        <div className="mt-8 space-y-6 leading-relaxed text-cream-300/80">
          <p>
            Near By is a premium marketplace connecting independent service providers with
            consenting adults, built around three principles: choice, privacy, and trust.
          </p>
          <p>
            Providers control their own pricing, availability, and profile — Near By simply gives
            them the tools to run their business safely and professionally. Customers get
            transparent pricing, verified profiles, and a secure booking and payment experience.
          </p>
          <p>
            We built Near By because the existing options were either unsafe, opaque about pricing,
            or treated providers as products rather than independent professionals. We believe a
            better way is possible — one that treats everyone involved as a consenting adult
            deserving of respect, privacy, and control over their own time.
          </p>
        </div>
      </FadeIn>
    </div>
  );
}
