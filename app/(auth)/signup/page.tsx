'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Sign up the user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (!data.user) {
        setError('Failed to create account');
        return;
      }

      // Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        display_name: displayName,
      });

      if (profileError) {
        setError('Failed to create profile');
        return;
      }

      // Create character
      const { data: charData, error: charError } = await supabase.from('characters').insert({
        user_id: data.user.id,
      }).select().single();

      if (charError || !charData) {
        setError('Failed to create character');
        return;
      }

      // Initialize attributes
      const attributes = ['intellect', 'strength', 'focus', 'vitality'];
      const { error: attrError } = await supabase.from('character_attributes').insert(
        attributes.map((attr) => ({
          character_id: charData.id,
          attribute: attr,
          xp: 0,
        }))
      );

      if (attrError) {
        setError('Failed to initialize character');
        return;
      }

      router.push('/dashboard');
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/10 border-white/20 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-white">Create Your Character</CardTitle>
          <CardDescription className="text-gray-300">Begin your epic adventure</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Character Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your adventurer name"
                className="input w-full bg-white/10 border-white/20 text-white placeholder-gray-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="input w-full bg-white/10 border-white/20 text-white placeholder-gray-400"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input w-full bg-white/10 border-white/20 text-white placeholder-gray-400"
                required
              />
            </div>
            {error && <div className="text-red-400 text-sm">{error}</div>}
            <Button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700">
              {loading ? 'Creating account...' : 'Start Adventure'}
            </Button>
          </form>
          <p className="text-center text-gray-300 text-sm mt-4">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-amber-400 hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
