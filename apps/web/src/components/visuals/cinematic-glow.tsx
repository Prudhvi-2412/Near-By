import { SkylineSilhouette } from './skyline-silhouette';

/**
 * Original, license-free "cinematic" backdrop used in place of stock photography
 * (see README for the reasoning). Swap for a licensed photo by dropping a
 * <picture>/<Image> in front of this component — the gradients still work
 * as a graceful base layer.
 */
export function CinematicGlow({ className = '' }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div className="absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-burgundy-700/30 blur-[120px]" />
      <div className="absolute right-0 top-1/3 h-[400px] w-[400px] rounded-full bg-gold-500/10 blur-[100px]" />
      <div className="absolute bottom-0 left-0 right-0">
        <SkylineSilhouette className="h-40 w-full opacity-60" />
      </div>
      <div className="grain-overlay" />
    </div>
  );
}
