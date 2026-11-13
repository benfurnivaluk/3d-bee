/* eslint-disable @next/next/no-img-element */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** BeeRadar wordmark (public/beeradar-logo.svg). Height drives the size; width follows the 486:82 ratio. */
export function Logo({ height = 22, className = '' }: { height?: number; className?: string }) {
  return <img src={`${BASE}/beeradar-logo.svg`} alt="BeeRadar" height={height} width={Math.round((height * 486) / 82)} className={className} style={{ height, width: 'auto' }} />;
}
