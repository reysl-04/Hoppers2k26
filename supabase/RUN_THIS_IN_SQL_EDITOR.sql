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
