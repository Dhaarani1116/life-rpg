# Setup & Deployment Guide

## Quick Start for Hackathon

### 1. Clone & Install

```bash
cd web_hack
npm install
```

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for it to initialize
4. Copy the **Project URL** and **Anon Key** from Settings → API

### 3. Configure Environment

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Initialize Database

In Supabase Dashboard:

1. Go to **SQL Editor**
2. Click **New Query**
3. Copy & paste content from `supabase/migrations/001_init.sql`
4. Click **Run**
5. Repeat for `supabase/migrations/002_seed_relics.sql`

### 5. Enable Email Auth

In Supabase Dashboard:

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Save

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Testing the Demo Flow

### Critical Path (5 minutes)

1. **Landing page** → Click "Start Your Adventure"
2. **Signup** → Create account with email/password
3. **Dashboard** → View character (Level 1, 0 XP, 0 Gold)
4. **Create Quest** → 
   - Title: "Test Quest"
   - Attribute: Medium
   - Difficulty: Intellect
5. **Complete Quest** → Watch animations:
   - XP burst
   - Gold burst
   - Attribute XP
6. **Refresh** → Verify persistence
7. **Buy Relic** → Navigate to shop, purchase an item
8. **Character Page** → See all stats updated

### What Should Work

✅ Signup creates profile, character, and attributes  
✅ Quest completion triggers animations  
✅ XP/Gold/Attributes update server-side  
✅ Data persists across refreshes  
✅ Streak tracking works  
✅ Mobile layout is responsive  
✅ No console errors  

### Common Issues

**"Cannot find Supabase URL"**
- Check `.env.local` has correct values
- Restart dev server after updating env

**"Authentication failed"**
- Make sure Email auth is enabled in Supabase
- Verify ANON_KEY in env

**Animations not showing**
- Check browser console for errors
- Make sure Framer Motion is installed: `npm list framer-motion`

**Data not persisting**
- Verify RLS policies are enabled in Supabase
- Check that user_id matches authenticated user

---

## Production Build

```bash
npm run build
npm start
```

Build output goes to `.next/` directory.

---

## Deployment

### Vercel (Recommended)

```bash
npm i -g vercel
vercel login
vercel
```

Then add env vars in Vercel Dashboard → Settings → Environment Variables

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## Architecture Decisions

### Server Actions Over API Routes

- Direct database access with security
- Automatic CSRF protection
- Simpler error handling
- Type-safe request/response

### Non-Linear Leveling (Level^1.5)

- Early levels feel rewarding (fast progression)
- Late levels sustainable (steady growth)
- Avoids both grind walls and plateaus
- Encourages long-term engagement

### Attribute Separation

- Tasks tied to specific life domains
- Encourages balanced self-development
- Adds strategic variety to quest design
- Visualizes growth across multiple areas

### RLS + Server Calculation

- Users cannot manipulate XP/Gold/Level from client
- All mutations validated server-side
- Database constraints enforce data integrity
- Streaks calculated from activity records

---

## Performance Notes

- **First Load JS**: ~205 kB (including Framer Motion)
- **Static Routes**: Landing, login, signup (cached)
- **Dynamic Routes**: Dashboard, quests, relics, character (server-rendered on demand)
- **Real-time Updates**: 15-30 second auto-refresh on game screens

---

## Accessibility Checklist

✅ Semantic HTML (`<button>`, `<form>`, `<nav>`)  
✅ Form labels associated with inputs  
✅ Keyboard navigation (Tab, Enter, Space)  
✅ Focus visible on all interactive elements  
✅ Color contrast meets WCAG AA  
✅ Error messages helpful and visible  
✅ Loading states clearly indicated  
✅ Responsive layout for mobile/tablet/desktop  

---

## Security Checklist

✅ No XP/Gold/Level trusted from client  
✅ All mutations validated server-side  
✅ User ownership checked on every operation  
✅ RLS prevents cross-user data access  
✅ Service Role Key only used server-side  
✅ Env vars not exposed to client (NEXT_PUBLIC_ prefix used carefully)  
✅ Quest rewards determined by trusted quest record, not user input  

---

## Future Enhancements

- Quest templates library
- Social leaderboards
- Achievement system
- Mobile app (React Native)
- Advanced analytics dashboard
- Customizable attributes
- Import/export progress
- Multiplayer guilds

---

## Troubleshooting

**App won't start**
```bash
rm -rf .next node_modules package-lock.json
npm install
npm run dev
```

**TypeScript errors**
```bash
npm run build  # Full type check
```

**Supabase connection issues**
- Verify Project URL and Anon Key in `.env.local`
- Check Supabase project status
- Try `curl <PROJECT_URL>` from terminal

**Database queries failing**
- Check RLS policies in Supabase Dashboard
- Verify authenticated user ID matches
- Look for SQL errors in Supabase logs

---

## Support

For hackathon:
- Check README.md for architecture overview
- Check lib/rpg/progression.ts for game logic
- Check lib/actions/quests.ts for server mutations
- Check supabase/migrations/001_init.sql for schema

Good luck! 🚀
