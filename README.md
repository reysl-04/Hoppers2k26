# ZeroCrust

A mobile-first SPA for sustainable food tracking, calorie management, and reducing food waste.

## Features

- **Login**: Email/password + Google & Apple sign-in (Supabase Auth)
- **Home**: Profile quick access, upload CTA, data overview
- **Profile**: User info, description, stats, calendar link
- **History**: Monthly calendar, achievements, calorie-limit encouragement
- **Upload & Analyze**: Photo upload, AI analysis (placeholder), gamification (XP), meme generator (placeholder)

## Tech Stack

- React 19 + TypeScript + Vite
- Supabase (Auth + Database)
- Tailwind CSS v4
- React Router v7

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure Supabase**
   - Create a project at [supabase.com](https://supabase.com)
   - Copy `.env.example` to `.env` and add:
     ```
     VITE_SUPABASE_URL=your_project_url
     VITE_SUPABASE_ANON_KEY=your_anon_key
     ```

3. **Database & Storage** – Run the migration and create the storage bucket. See [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md).

4. **Enable Google Auth** – See [docs/GOOGLE_AUTH_SETUP.md](docs/GOOGLE_AUTH_SETUP.md) for step-by-step setup in Google Cloud Console and Supabase.

5. **Run dev server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## APIs

- **LogMeal** (integrated): Food recognition & nutrition. Add `VITE_LOGMEAL_API_KEY` to `.env`. Get your APIUser token at [logmeal.com](https://logmeal.com). See [docs](https://docs.logmeal.com/docs/guides-getting-started-quickstart).
- **Meme generator**: Placeholder – add custom or third-party image API

## Deploy to Render

1. Push your code to GitHub and connect the repo at [render.com](https://render.com)
2. **Option A – Blueprint**: Render will detect `render.yaml` and create the static site automatically
3. **Option B – Manual**: Create a **Static Site**, set:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - Add a **Rewrite** rule: `/*` → `/index.html` (for React Router)
4. Add environment variables in the Render dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_LOGMEAL_API_KEY`
5. In Supabase Auth → URL Configuration, add your Render URL (e.g. `https://zerocrust.onrender.com`) to **Redirect URLs**
