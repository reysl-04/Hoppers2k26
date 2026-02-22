-- Copy everything below this line and paste into Supabase Dashboard → SQL Editor → New query

-- Food analyses table - stores user's meal logs with images and nutrition
create table if not exists food_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  type text not null check (type in ('calorie', 'before_after')),
  image_url text not null,
  image_url_after text,
  calories float not null,
  calories_after float,
  calories_consumed float,
  food_waste_calories float,
  nutritional_data jsonb,
  exp_earned int default 10
);

-- RLS
alter table food_analyses enable row level security;

drop policy if exists "Users can insert own analyses" on food_analyses;
create policy "Users can insert own analyses" on food_analyses
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can select own analyses" on food_analyses;
create policy "Users can select own analyses" on food_analyses
  for select using (auth.uid() = user_id);

drop policy if exists "Users can delete own analyses" on food_analyses;
create policy "Users can delete own analyses" on food_analyses
  for delete using (auth.uid() = user_id);

-- Index for date queries
create index if not exists food_analyses_user_created on food_analyses (user_id, created_at);

-- User stats: counters for achievements and level/XP
create table if not exists user_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_meals_logged int default 0,
  zero_waste_meals_count int default 0,
  low_sugar_meals_count int default 0,
  unique_food_items jsonb default '[]'::jsonb,
  unique_food_items_count int default 0,
  total_waste_grams float default 0,
  total_calories float default 0,
  total_protein float default 0,
  total_carbs float default 0,
  total_fat float default 0,
  total_fiber float default 0,
  total_sugar float default 0,
  daily_log_streak int default 0,
  last_log_date date,
  zero_waste_streak int default 0,
  balanced_meals_count int default 0,
  total_xp int default 0,
  updated_at timestamptz default now()
);

alter table user_stats enable row level security;
drop policy if exists "Users can select own stats" on user_stats;
create policy "Users can select own stats" on user_stats for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own stats" on user_stats;
create policy "Users can insert own stats" on user_stats for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update own stats" on user_stats;
create policy "Users can update own stats" on user_stats for update using (auth.uid() = user_id);

create table if not exists user_achievements (
  user_id uuid references auth.users(id) on delete cascade,
  achievement_id text not null,
  unlocked_at timestamptz default now(),
  xp_awarded int not null,
  primary key (user_id, achievement_id)
);
alter table user_achievements enable row level security;
drop policy if exists "Users can select own achievements" on user_achievements;
create policy "Users can select own achievements" on user_achievements for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own achievements" on user_achievements;
create policy "Users can insert own achievements" on user_achievements for insert with check (auth.uid() = user_id);

-- Profiles table - for post author names and avatars
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  updated_at timestamptz default now()
);
alter table profiles enable row level security;
drop policy if exists "Profiles are viewable by everyone" on profiles;
create policy "Profiles are viewable by everyone" on profiles for select using (true);
drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'User'), new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
