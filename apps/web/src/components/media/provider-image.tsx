'use client';

import Image from 'next/image';
import { useState } from 'react';

const GRADIENTS = [
  'from-burgundy-700 via-charcoal-800 to-charcoal-950',
  'from-charcoal-800 via-burgundy-800 to-charcoal-950',
  'from-gold-600/40 via-charcoal-800 to-charcoal-950',
];

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function ProviderImage({
  src,
  name,
  className = '',
}: {
  src?: string | null;
  name: string;
  className?: string;
}) {
  const [errored, setErrored] = useState(false);
  const gradient = GRADIENTS[name.length % GRADIENTS.length];

  if (!src || errored) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br ${gradient} ${className}`}>
        <span className="font-display text-3xl text-cream-100/90">{initials(name)}</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image src={src} alt={name} fill className="object-cover" onError={() => setErrored(true)} sizes="400px" />
    </div>
  );
}
