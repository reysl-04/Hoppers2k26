# Google Auth Setup for ZeroCrust

Your app already has the Google sign-in button wired up. Follow these steps to enable it.

## 1. Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project or select an existing one
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. If prompted, configure the **OAuth consent screen**:
   - User type: **External** (for any Google user)
   - App name: **ZeroCrust**
   - Add your email as developer
   - Scopes: ensure `userinfo.email`, `userinfo.profile`, and `openid` are included
6. For **Application type**, choose **Web application**
7. Under **Authorized JavaScript origins**, add:
   - `http://localhost:5173` (local dev)
   - `https://your-app.onrender.com` (your Render URL)
8. Under **Authorized redirect URIs**, add your **Supabase callback URL**:
   - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
   - Find `YOUR_PROJECT_REF` in Supabase Dashboard → Project Settings → General
9. Click **Create** and copy the **Client ID** and **Client Secret**

## 2. Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. Open **Authentication** → **Providers**
3. Find **Google** and enable it
4. Paste the **Client ID** and **Client Secret** from Google
5. Save

## 3. Supabase Redirect URLs

1. In Supabase: **Authentication** → **URL Configuration**
2. Under **Redirect URLs**, add:
   - `http://localhost:5173/` (local dev)
   - `https://your-app.onrender.com/` (your Render URL)

## 4. Test

- **Local**: Run `npm run dev`, open `http://localhost:5173`, click "Google" on the login page
- **Production**: Deploy and test on your Render URL

## Troubleshooting

### "Site cannot be reached" after clicking Google

This usually means the **Supabase project is paused** or the callback URL is wrong.

**1. Check if Supabase project is paused**
- Go to [Supabase Dashboard](https://supabase.com/dashboard)
- If you see "Project is paused", click **Restore project** (free tier projects pause after ~7 days of inactivity)
- Wait a few minutes for it to come back online

**2. Verify Google redirect URI**
- In Google Cloud Console → Credentials → your OAuth client
- **Authorized redirect URIs** must be **exactly**:
  ```
  https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
  ```
- Get `YOUR_PROJECT_REF` from Supabase → Project Settings → General → Reference ID
- No trailing slash, no typos

**3. Test Supabase is reachable**
- Open `https://YOUR_PROJECT_REF.supabase.co` in your browser
- If it doesn't load, the project is likely paused

### Other errors

| Error | Fix |
|-------|-----|
| "redirect_uri_mismatch" | Ensure the Supabase callback URL is exactly correct in Google's Authorized redirect URIs |
| "Access blocked" | Complete OAuth consent screen setup in Google Cloud |
| Blank after sign-in | Add your app URL to Supabase Redirect URLs |
