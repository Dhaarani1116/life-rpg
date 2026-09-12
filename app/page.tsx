import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Navigation */}
      <nav className="border-b border-white/10 backdrop-blur-md">
        <div className="container-safe py-4 flex items-center justify-between">
          <div className="text-2xl font-bold">⚔️ Life RPG</div>
          <Link href="/auth/login">
            <Button variant="outline" className="text-white border-white/30 hover:bg-white/10">
              Sign In
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="container-safe py-20 sm:py-32 text-center">
        <h1 className="text-5xl sm:text-7xl font-bold mb-6 leading-tight">
          Turn Your Life Into an Adventure
        </h1>
        <p className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Complete real-world tasks as quests. Level up your character. Unlock rewards.
          <br />
          <span className="text-amber-400">Your life is an RPG.</span>
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/signup">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white">
              Start Your Adventure
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button size="lg" variant="outline" className="text-white border-white/30 hover:bg-white/10">
              Already Have an Account?
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container-safe py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: '🎮',
              title: 'Create Quests',
              description: 'Turn your daily tasks into epic quests with rewards and difficulty levels.',
            },
            {
              icon: '📈',
              title: 'Level Up',
              description: 'Complete quests to gain XP and advance through non-linear progression.',
            },
            {
              icon: '⚡',
              title: 'Earn Rewards',
              description: 'Build streaks, earn gold, and unlock special relics from the shop.',
            },
          ].map((feature, i) => (
            <div key={i} className="card bg-white/10 border-white/20 backdrop-blur-sm">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-safe py-20 text-center">
        <h2 className="text-4xl font-bold mb-6">Ready to Begin?</h2>
        <p className="text-gray-300 mb-8">Your adventure starts now.</p>
        <Link href="/auth/signup">
          <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
            Create Your Character
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-gray-400 text-sm">
        <p>Life RPG © 2026 • Made for the web hackathon</p>
      </footer>
    </div>
  );
}
