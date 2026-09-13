# Life RPG

**Transform your daily tasks into an epic role-playing game.**

[![Live Demo](https://img.shields.io/badge/Live_App-life--rpg--six--theta.vercel.app-000000?style=for-the-badge&logo=vercel)](https://life-rpg-six-theta.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Dhaarani1116%2Flife--rpg-blue?style=for-the-badge&logo=github)](https://github.com/Dhaarani1116/life-rpg)

- **Live Deployed App**: [https://life-rpg-six-theta.vercel.app](https://life-rpg-six-theta.vercel.app)
- **GitHub Repository**: [https://github.com/Dhaarani1116/life-rpg](https://github.com/Dhaarani1116/life-rpg)

A full-stack web application built for a hackathon that gamifies personal productivity through quest completion, character progression, and attribute-based rewards.

## 🎮 Overview

Life RPG turns your to-do list into an adventure. Complete real-world tasks as quests, earn XP and gold, develop your character's attributes, and unlock rewards in the relics shop. Built with modern web technologies and a focus on polish, game feel, performance, and accessibility.

## ✨ Core Features

- **Dashboard Overview**: Level badge, animated XP bar, active streaks, Gold balance, and recent tasks.
- **Character Progression**: Non-linear leveling system with escalating XP requirements: `floor(100 * N^1.5)`.
- **Attribute Development**: Tasks contribute XP to four distinct attributes:
  - **Intellect** (🧠) — Learning, coding, studying, deep reading
  - **Strength** (💪) — Physical exercise, fitness, heavy lifting
  - **Focus** (🎯) — Deep work sessions, meditation, single-tasking
  - **Vitality** (❤️) — Health, nutrition, sleep, wellness
- **Daily Streak Multiplier**: Consecutive active days grant an escalating XP bonus multiplier up to +50%.
- **Today's Adventure**: Focused daily RPG experience highlighting the "Current Mission", an animated completion progress bar, and satisfying "Adventure Complete" celebration.
- **All Quests Backlog**: Complete task management with difficulty scaling (Trivial, Easy, Medium, Hard, Epic) and attribute tagging.
- **Atomic Quest Completion**: Server-authoritative PostgreSQL row-locking RPC (`commit_quest_completion`) ensuring secure XP, Gold, and streak updates without client race conditions.
- **Relic Vault & Economy**: Spend earned Gold on collectible relics spanning 5 rarity tiers (Common to Legendary).
- **Atomic Relic Purchasing**: Server-side RPC (`purchase_relic`) with pessimistic row locking preventing double-spend and duplicate ownership.
- **Responsive Navigation**: Adaptive desktop header and dedicated mobile bottom navigation dock.
- **Route Protection & Auth**: Secure Supabase email/password authentication hardened with Next.js edge middleware.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Framer Motion, Lucide Icons
- **Backend**: Next.js Server Actions, Postgres RPCs (`SECURITY DEFINER`)
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Validation**: Zod & Server-side validation
- **Testing**: Jest (RPG progression engine and streak calculations)

## 🚀 Local Setup Guide

Follow these steps to run Life RPG locally:

### 1. Prerequisites

- Node.js 18+
- npm or yarn
- A Supabase project (free tier works great)

### 2. Clone and Install Dependencies

```bash
git clone https://github.com/Dhaarani1116/life-rpg.git
cd life-rpg
npm install
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Note**: `.env.local` is strictly ignored by Git and will never be committed.

### 4. Apply Database Migrations

In your Supabase project dashboard, open the **SQL Editor** and run the migration files located in `supabase/migrations/` in the following exact order:

1. `001_init.sql` — Core schema tables (`profiles`, `characters`, `character_attributes`, `quests`, `quest_completions`, `relics`, `inventory`, `daily_activity`) and baseline Row Level Security policies.
2. `002_seed_relics.sql` — Relic shop catalog across Common, Uncommon, Rare, Epic, and Legendary tiers.
3. `003_quest_completion_rpc.sql` — **Security-Critical**: Atomic `commit_quest_completion` RPC with row-level locks preventing race conditions and client-side reward manipulation.
4. `004_secure_relic_purchase.sql` — **Security-Critical**: Unique constraint on inventory ownership and atomic `purchase_relic` RPC with pessimistic Gold locking.

> **Important**: Migrations `003` and `004` must be applied to the database before quest completions and relic purchases can execute.

### 5. Enable Email Authentication

In your Supabase dashboard under **Authentication > Providers**, enable the **Email** provider.

### 6. Run Automated Tests

Run the deterministic RPG engine test suite:

```bash
npm test --silent
```

### 7. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 Project Structure

```
├── app/                    # Next.js App Router
│   ├── (auth)/             # Auth routes (login, signup)
│   ├── (game)/             # Protected game routes (dashboard, quests, relics, character)
│   ├── globals.css         # Design tokens & color system
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Public landing page
├── components/
│   ├── ui/                 # Core UI primitives (Button, Card)
│   └── game/               # RPG components (XPBar, RewardBurst, RelicCard, LevelUpOverlay)
├── lib/
│   ├── actions/            # Server actions (quests, relics)
│   ├── rpg/                # RPG progression formulas & Jest test suite
│   └── supabase/           # Client, server, and session handlers
├── middleware.ts           # Route protection middleware
├── supabase/
│   └── migrations/         # PostgreSQL schema & RPC migrations (001 - 004)
├── types/                  # TypeScript interface definitions
└── .env.example            # Environment variable template
```

## 🏗️ RPG Engine Mechanics

### Non-Linear Leveling Formula

```
XP for level N = floor(100 * N^1.5)
```

| Level | XP Required (Level) | Cumulative Total XP |
|-------|---------------------|---------------------|
| 1     | 100                 | 0                   |
| 2     | 282                 | 100                 |
| 3     | 519                 | 382                 |
| 4     | 800                 | 901                 |
| 5     | 1,118               | 1,701               |

### Difficulty Rewards

| Difficulty | Base XP Reward | Base Gold Reward |
|------------|----------------|------------------|
| Trivial    | 25 XP          | 5 Gold           |
| Easy       | 50 XP          | 10 Gold          |
| Medium     | 100 XP         | 25 Gold          |
| Hard       | 200 XP         | 50 Gold          |
| Epic       | 500 XP         | 150 Gold         |

### Streak Bonus Multiplier

- **Formula**: `1 + min(streakDays * 0.1, 0.5)`
- Consecutive daily activity provides up to a **+50% bonus XP** cap.

## 🔒 Security Architecture

- **PostgreSQL Row-Level Locks**: `commit_quest_completion` and `purchase_relic` use `FOR UPDATE` locks on user character and quest rows to guarantee atomicity.
- **Zero Client Trust**: All rewards, streak increments, and currency deductions are executed within Postgres stored procedures (`SECURITY DEFINER`).
- **Row Level Security (RLS)**: Users are restricted to querying and mutating only their own rows via `auth.uid()`.
- **Edge Route Protection**: Middleware intercepts requests to protected routes (`/dashboard`, `/quests`, `/relics`, `/character`), redirecting unauthenticated traffic to `/login`.

## 🚢 Production Deployment Notes

When deploying to a production host (e.g. Vercel, Netlify):

1. Set the root directory if deploying from a subfolder.
2. In the hosting dashboard's Environment Variables settings, configure:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL`
3. Ensure all migrations (`001_init.sql` through `004_secure_relic_purchase.sql`) are executed on your production Supabase database.
