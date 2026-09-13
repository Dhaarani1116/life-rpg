import { redirect } from 'next/navigation';
import { getUserFromSession } from '@/lib/supabase/server';
import GameNavShell from '@/components/game/nav-shell';

export default async function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserFromSession();

  if (!user) {
    redirect('/login');
  }

  return <GameNavShell>{children}</GameNavShell>;
}
