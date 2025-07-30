import type { Metadata } from 'next';
import './globals.css';
import { SidebarProvider } from '@/components/ui/sidebar';
import { GameDataProvider } from '@/contexts/game-data-context';
import { geistSans } from '@/styles/typography';

export const metadata: Metadata = {
  title: 'BitCraft Settlement Guide',
  description: 'Your comprehensive guide to BitCraft settlements, resources, and crafting.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} antialiased font-sans`}>
        <GameDataProvider>
          <SidebarProvider>
            {children}
          </SidebarProvider>
        </GameDataProvider>
      </body>
    </html>
  );
}