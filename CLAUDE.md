# Christmas Lights Route Optimizer

## Project Overview
A mobile-first web app to help users plan optimal routes for viewing Christmas light displays in their neighborhood.

## Tech Stack
- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS (mobile-first)
- **Database**: Supabase (pending setup)
- **Mobile**: Capacitor for iOS conversion
- **PWA**: next-pwa for installable web app

## Key Files
- `src/app/layout.tsx` - Root layout with mobile-first viewport
- `src/lib/supabase.ts` - Supabase client setup
- `capacitor.config.ts` - iOS/Android configuration
- `public/manifest.json` - PWA manifest

## Commands
| Task | Command |
|------|---------|
| Run locally | `npm run dev` |
| Deploy to Vercel | `npx vercel --prod` |
| Push to GitHub | `git push` |
| Sync iOS build | `npx cap sync ios` |

## URLs
- **Production**: https://christmas-lights-route-optimizer.vercel.app
- **GitHub**: https://github.com/brandonogram/christmas-lights-route-optimizer

## Notes
- Supabase project needs to be created (free tier limit reached)
- Add Supabase credentials to `.env.local` after creating project
