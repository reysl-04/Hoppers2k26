-- Posts table (if not exists) - ensure likes column
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  image_url text not null,
  image_url_after text,
  description text,
  hashtags text,
  created_at timestamptz default now(),
  likes int default 0
);

alter table posts enable row level security;
drop policy if exists "Anyone can view posts" on posts;
create policy "Anyone can view posts" on posts for select using (true);
drop policy if exists "Users can insert own posts" on posts;
create policy "Users can insert own posts" on posts for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update own posts" on posts;
create policy "Users can update own posts" on posts for update using (auth.uid() = user_id);
drop policy if exists "Users can delete own posts" on posts;
create policy "Users can delete own posts" on posts for delete using (auth.uid() = user_id);

-- Add likes column if missing
alter table posts add column if not exists likes int default 0;
alter table posts add column if not exists image_url_after text;

-- Post likes
create table if not exists post_likes (
  user_id uuid references auth.users(id) on delete cascade,
  post_id uuid references posts(id) on delete cascade,
  primary key (user_id, post_id)
);
alter table post_likes enable row level security;

create or replace function public.sync_post_likes_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update posts set likes = coalesce(likes, 0) + 1 where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update posts set likes = greatest(coalesce(likes, 0) - 1, 0) where id = OLD.post_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;
drop trigger if exists sync_post_likes_trigger on post_likes;
create trigger sync_post_likes_trigger
  after insert or delete on post_likes
  for each row execute procedure public.sync_post_likes_count();

drop policy if exists "Anyone can view likes" on post_likes;
create policy "Anyone can view likes" on post_likes for select using (true);
drop policy if exists "Users can like posts" on post_likes;
create policy "Users can like posts" on post_likes for insert with check (auth.uid() = user_id);
drop policy if exists "Users can unlike" on post_likes;
create policy "Users can unlike" on post_likes for delete using (auth.uid() = user_id);

-- Post saves (bookmarks)
create table if not exists post_saves (
  user_id uuid references auth.users(id) on delete cascade,
  post_id uuid references posts(id) on delete cascade,
  primary key (user_id, post_id)
);
alter table post_saves enable row level security;
drop policy if exists "Users can view own saves" on post_saves;
create policy "Users can view own saves" on post_saves for select using (auth.uid() = user_id);
drop policy if exists "Users can save posts" on post_saves;
create policy "Users can save posts" on post_saves for insert with check (auth.uid() = user_id);
drop policy if exists "Users can unsave" on post_saves;
create policy "Users can unsave" on post_saves for delete using (auth.uid() = user_id);

-- Post comments
create table if not exists post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  text text not null,
  created_at timestamptz default now()
);
alter table post_comments enable row level security;
drop policy if exists "Anyone can view comments" on post_comments;
create policy "Anyone can view comments" on post_comments for select using (true);
drop policy if exists "Users can add comments" on post_comments;
create policy "Users can add comments" on post_comments for insert with check (auth.uid() = user_id);
drop policy if exists "Users can delete own comments" on post_comments;
create policy "Users can delete own comments" on post_comments for delete using (auth.uid() = user_id);
