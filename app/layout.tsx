import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Goodmonth — staying pays', description: 'A little less, month after month. Subscriptions, billing, and a little something for staying.', icons: { icon: '/icon.svg' } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
