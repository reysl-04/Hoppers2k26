# Supabase Setup for ZeroCrust

## 1. Run the migration

1. Open **Supabase Dashboard** → **SQL Editor** → **New query**
2. Open `supabase/RUN_THIS_IN_SQL_EDITOR.sql` in your project
3. **Copy the SQL** (everything from `create table` to the last line)
4. **Paste** into the Supabase SQL Editor
5. Click **Run**

Do not paste the file path—only the SQL code.

## 2. Create Storage bucket (required for saving images)

1. Go to **Supabase Dashboard** → **Storage**
2. Click **New bucket**
3. **Name:** `food-images` (must match exactly)
4. Enable **Public bucket** (so image URLs work for display)
5. Click **Create bucket**

If you skip this step, you'll get "Bucket not found" when uploading.

## 3. Storage policies

In **Storage** → **Policies** for the `food-images` bucket, add:

**Allow authenticated users to upload:**
- Operation: **Insert**
- Policy: `auth.role() = 'authenticated'`

(Public buckets allow anyone to view; the insert policy lets logged-in users upload.)
</think>

<｜tool▁calls▁begin｜><｜tool▁call▁begin｜>
Read