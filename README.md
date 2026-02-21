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

## Deploy

Optimized for Cloudflare Pages. Run `npm run build` and deploy the `dist` folder.
