import { redirect } from 'next/navigation';
import { getUserFromSession } from '@/lib/supabase/server';

export default async function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserFromSession();

  if (!user) {
    redirect('/auth/login');
  }

  return <>{children}</>;
}
