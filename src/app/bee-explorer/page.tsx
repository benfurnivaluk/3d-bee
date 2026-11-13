import type { Metadata } from 'next';
import BeeExplorer from '@/components/bee/BeeExplorer';

export const metadata: Metadata = {
  title: 'The Honey Bee — Explore its Anatomy | BeeRadar',
};

export default function BeeExplorerPage() {
  return <BeeExplorer />;
}
