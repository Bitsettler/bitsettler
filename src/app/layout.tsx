import type { Metadata } from 'next';
import './globals.css';
import { SidebarProvider } from '@/components/ui/sidebar';
import { GameDataProvider } from '@/contexts/game-data-context';
import { AuthProvider } from '@/components/auth-provider';

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
    <html lang="en">
      <body className="font-sans">
        <AuthProvider>
          <GameDataProvider>
            <SidebarProvider>
              {children}
            </SidebarProvider>
          </GameDataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}