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

-- RLS
alter table user_stats enable row level security;

drop policy if exists "Users can select own stats" on user_stats;
create policy "Users can select own stats" on user_stats
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own stats" on user_stats;
create policy "Users can insert own stats" on user_stats
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own stats" on user_stats;
create policy "Users can update own stats" on user_stats
  for update using (auth.uid() = user_id);

-- Unlocked achievements (for XP tracking)
create table if not exists user_achievements (
  user_id uuid references auth.users(id) on delete cascade,
  achievement_id text not null,
  unlocked_at timestamptz default now(),
  xp_awarded int not null,
  primary key (user_id, achievement_id)
);

alter table user_achievements enable row level security;

drop policy if exists "Users can select own achievements" on user_achievements;
create policy "Users can select own achievements" on user_achievements
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own achievements" on user_achievements;
create policy "Users can insert own achievements" on user_achievements
  for insert with check (auth.uid() = user_id);
