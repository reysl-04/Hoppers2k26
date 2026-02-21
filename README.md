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
   - Enable Google and Apple auth in Authentication → Providers
   - Copy `.env.example` to `.env` and add:
     ```
     VITE_SUPABASE_URL=your_project_url
     VITE_SUPABASE_ANON_KEY=your_anon_key
     ```

3. **Run dev server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## APIs to Integrate

- **Food Calories**: [CalorieNinjas](https://calorieninjas.com/), [Foodvisor](https://www.foodvisor.io/), or [Edamam Vision](https://developer.edamam.com/)
- **Meme generator**: Custom or third-party image transformation API

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
5. In Supabase Auth → URL Configuration, add your Render URL (e.g. `https://zerocrust.onrender.com`) to **Redirect URLs**
