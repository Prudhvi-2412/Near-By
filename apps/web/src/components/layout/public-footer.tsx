import Link from 'next/link';

const COLUMNS = [
  {
    title: 'Near By',
    links: [
      { href: '/about', label: 'About' },
      { href: '/how-it-works', label: 'How it works' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    title: 'Trust',
    links: [
      { href: '/safety', label: 'Safety & privacy' },
      { href: '/register', label: 'Become a provider' },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-white/[0.06] bg-charcoal-950">
      <div className="container grid gap-10 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-2xl text-cream-50">
            Near <span className="text-gradient-gold">By</span>
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream-300/60">
            A premium marketplace built around choice, privacy, and trusted connections between
            verified independent providers and consenting adults.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="text-xs font-medium uppercase tracking-wider text-gold-400/80">{col.title}</p>
            <ul className="mt-4 space-y-3">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-cream-300/70 hover:text-cream-100">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/[0.06] py-6">
        <p className="container text-center text-xs text-cream-400/40">
          © {new Date().getFullYear()} Near By. For consenting adults, 18+. All providers are independent operators.
        </p>
      </div>
    </footer>
  );
}
