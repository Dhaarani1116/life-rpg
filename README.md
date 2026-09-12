# Life RPG

**Transform your daily tasks into an epic role-playing game.**

A full-stack web application built for a hackathon that gamifies personal productivity through quest completion, character progression, and attribute-based rewards.

## 🎮 Overview

Life RPG turns your to-do list into an adventure. Complete real-world tasks as quests, earn XP and gold, develop your character's attributes, and unlock rewards in the relics shop. Built with modern web technologies and a focus on polish, performance, and accessibility.

## ✨ Key Features

- **Authentic RPG Progression**: Non-linear leveling system with escalating XP requirements
- **Quest System**: Create, manage, and complete tasks with difficulty scaling
- **Attribute Development**: Tasks contribute XP to Intellect, Strength, Focus, and Vitality
- **Streak Tracking**: Daily activity bonus multiplier for consecutive active days
- **Economy & Rewards**: Earn gold, purchase relics, build your collection
- **Secure Backend**: Server-side validation, Supabase RLS, no client-side authority
- **Responsive Design**: Works on desktop, tablet, and mobile with full keyboard navigation
- **Accessibility**: Semantic HTML, proper labels, ARIA support, high contrast

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Next.js Server Actions, Postgres
- **Database**: Supabase (Auth + PostgreSQL + RLS)
- **Validation**: Zod
- **Testing**: Playwright (E2E)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. **Clone and install**

```bash
cd web_hack
npm install
```

2. **Set up environment variables**

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **Set up Supabase database**

In your Supabase project:

- Go to **SQL Editor** and run the migration in `supabase/migrations/001_init.sql`
- This creates all tables with Row Level Security policies

4. **Enable Email Auth**

In Supabase > Authentication > Providers, enable Email provider.

5. **Run development server**

```bash
npm run dev
```

Visit `http://localhost:3000`

## 📱 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Authentication pages
│   │   ├── login/
│   │   └── signup/
│   ├── (game)/             # Authenticated app pages
│   │   ├── dashboard/
│   │   ├── quests/
│   │   ├── relics/
│   │   └── character/
│   └── page.tsx            # Landing page
├── components/
│   ├── ui/                 # Reusable UI components
│   └── game/               # RPG-specific components
├── lib/
│   ├── rpg/                # Progression engine
│   ├── supabase/           # Auth & DB clients
│   ├── actions/            # Server actions
│   └── validators/         # Zod schemas
├── types/                  # TypeScript types
└── styles/                 # Global CSS

supabase/
└── migrations/             # Database schema
```

## 🎯 Core Gameplay Loop

1. **Create a Quest** — Add a real-world task with difficulty (Trivial → Epic)
2. **Complete the Quest** — Mark it done and instantly:
   - Gain XP (scaled by difficulty and streak bonus)
   - Earn Gold
   - Develop attributes (Intellect, Strength, Focus, Vitality)
   - Advance toward next level
3. **Track Progress** — See character level, XP bar, current streak, gold, and attributes
4. **Spend Gold** — Purchase relics from the shop to customize your collection
5. **Watch Growth** — Refresh and see all progress persists

## 🏗️ RPG Engine

### Leveling System

**Non-linear progression** with increasing XP requirements per level:

```
XP for level N = floor(100 * N^1.5)
```

This creates a smooth difficulty curve where early levels feel rewarding and later levels provide meaningful long-term goals.

### Difficulty Scaling

| Difficulty | XP Reward | Gold | Use Case |
|-----------|-----------|------|----------|
| Trivial | 25 | 5 | Small tasks |
| Easy | 50 | 10 | Regular tasks |
| Medium | 100 | 25 | Standard quests |
| Hard | 200 | 50 | Challenging work |
| Epic | 500 | 150 | Major projects |

### Streak Bonus

Consecutive days active grant a bonus:
- **1 day**: +10% XP
- **5 days**: +50% XP (capped maximum)

Breaks only if you miss a day.

### Attributes

Tasks are tagged with one of four attributes:

- **Intellect** (🧠) — Learning, coding, studying
- **Strength** (💪) — Physical exercise, heavy lifting
- **Focus** (🎯) — Deep work, meditation, concentration
- **Vitality** (❤️) — Health, running, wellness

Each attribute accumulates independent XP, tracked separately on the character sheet.

## 🔒 Security

- **No client authority** — XP, levels, currency calculated server-side only
- **Row Level Security** — All tables protected; users can only access their own data
- **Validation** — Zod schemas + server-side validation on every mutation
- **Authorization** — Verified user sessions on protected routes
- **Authenticated mutations** — All modifications go through server actions

## 🎨 Design System

**Modern RPG × Personal Adventure Journal**

- Deep purple primary (#9333EA)
- Warm golden secondary (#F59E0B)
- Attribute-specific accent colors
- Responsive glassmorphic cards
- Smooth micro-interactions via Framer Motion
- Accessible throughout (WCAG 2.1 AA target)

## 📊 Database Schema

```
profiles              — user identity
characters           — level, XP, gold, streaks
character_attributes — attribute XP tracking
quests               — task definitions
quest_completions    — completion audit trail
relics               — reward item catalog
inventory            — earned items per user
daily_activity       — streak tracking
```

All tables use UUID primary keys, timestamp tracking, and Row Level Security policies.

## ✅ Testing

### Manual Testing Checklist

- [ ] Sign up creates character and attributes
- [ ] Login returns to dashboard
- [ ] Create quest with various difficulties
- [ ] Complete quest updates XP, gold, attributes
- [ ] XP bar animates and reflects progress
- [ ] Level up triggers celebration
- [ ] Refresh persists all data
- [ ] Delete quest (only if incomplete)
- [ ] Purchase relic with gold
- [ ] Character page shows full stats
- [ ] Mobile responsive layout
- [ ] Keyboard navigation works
- [ ] No console errors

### Automated Testing (Playwright)

```bash
npm run test:e2e
```

Tests the critical path:
1. Register user
2. Create quest
3. Complete quest
4. Verify XP/gold/attributes update
5. Refresh page
6. Verify persistence

## 🚢 Deployment

Build for production:

```bash
npm run build
npm start
```

Deploy to Vercel:

```bash
vercel deploy
```

Ensure environment variables are set in Vercel project settings.

## 📝 Architecture Notes

### Why Server Actions?

Server Actions eliminate the need for explicit API routes while providing:
- Automatic serialization/deserialization
- Built-in CSRF protection
- Seamless TypeScript validation
- Direct database access with security

### Why Non-Linear Leveling?

Early levels feel rewarding (fast progression), while later levels are sustainable (slower, steady growth). This prevents both the "grind wall" of linear systems and the "plateau" of exponential systems.

### Why Separate Attributes?

Instead of a single "XP pool," attributes tie progression to specific life domains, encouraging balanced self-development and adding strategic variety to quest design.

## 🎯 Future Enhancements

- Achievements and badges
- Leaderboards (optional)
- Quest templates and presets
- Social features (optional)
- Mobile app (React Native)
- Quest history and stats
- Import/export progress
- Customizable attribute names
- Quest categories and filtering

## 📄 License

Built for hackathon. Adapt and expand as needed.

## 🤝 Contributing

This is a hackathon submission. For improvements or fixes:

1. Create a feature branch
2. Make focused changes
3. Test thoroughly
4. Submit PR with clear description

---

**Ready to start your adventure?** [Sign up and begin your first quest →](https://localhost:3000/auth/signup)
