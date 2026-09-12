import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Life RPG – Turn Your Life Into an Adventure',
  description: 'Transform your daily tasks into an epic role-playing game. Complete quests, level up your character, and unlock rewards.',
  keywords: ['productivity', 'gamification', 'rpg', 'tasks', 'goals'],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
