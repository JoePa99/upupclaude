# Getting Your Supabase API Keys

When you set up Supabase, you need to copy 3 values into Vercel. Here's exactly where to find them:

## Step-by-Step

### 1. Create Your Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up
2. Click **"New Project"**
3. Fill in:
   - Project name: `upupdnd-prod` (or whatever you prefer)
   - Database password: (create a strong password - save this!)
   - Region: Choose closest to your users
4. Click **"Create new project"**
5. Wait ~2 minutes for setup to complete

### 2. Find Your API Keys
Once your project is ready:

1. Look at the left sidebar
2. Click the **gear icon ⚙️** at the bottom (Settings)
3. Click **"API"** in the settings menu

You'll see a page with these sections:

#### **Project URL**
```
https://abcdefgh.supabase.co
```
- Copy this entire URL
- This goes in Vercel as: `NEXT_PUBLIC_SUPABASE_URL`

#### **Project API keys**

There are 2 keys here:

**1. anon/public key** (labeled "anon public")
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI...
```
- This is a very long string starting with `eyJ`
- Copy the entire thing
- This goes in Vercel as: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ Safe to use in browser (has limited permissions)

**2. service_role key** (labeled "service_role")
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI...
```
- Also starts with `eyJ` but different from anon key
- Click **"Reveal"** to see it, then copy
- This goes in Vercel as: `SUPABASE_SERVICE_ROLE_KEY`
- ⚠️ **Keep this SECRET!** Full database access
- Never commit this to Git or expose in browser

### 3. Add to Vercel

In your Vercel project:
1. Go to **Settings → Environment Variables**
2. Add these 3 variables:

```
NEXT_PUBLIC_SUPABASE_URL
Value: https://abcdefgh.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. Make sure they're set for: **Production**, **Preview**, and **Development**
4. Click **"Save"**

### 4. Redeploy

After adding environment variables:
1. Go to **Deployments** tab
2. Click **"..."** on your latest deployment
3. Click **"Redeploy"**

Your app will now connect to Supabase!

---

## Visual Guide

```
Supabase Dashboard
├─ Settings (⚙️)
│  └─ API
│     ├─ Project URL ────────────→ NEXT_PUBLIC_SUPABASE_URL
│     └─ Project API keys
│        ├─ anon public ─────────→ NEXT_PUBLIC_SUPABASE_ANON_KEY
│        └─ service_role [Reveal]→ SUPABASE_SERVICE_ROLE_KEY
│
└─ Copy these to Vercel Environment Variables
```

## Common Mistakes

❌ **Copying the wrong key**
- Make sure you copy the full key (they're very long!)
- Don't accidentally copy just part of it

❌ **Using service_role in browser code**
- Only use service_role in API routes (server-side)
- Use anon key for client-side code

❌ **Forgetting to redeploy**
- Environment variables only take effect after redeployment
- Always redeploy after adding/changing env vars

## Testing

To verify it works:
1. Visit your deployed site
2. Try signing up with an email
3. Check Supabase → Authentication → Users
4. You should see your new user appear!

If something doesn't work:
- Check Vercel function logs for errors
- Verify all 3 env vars are set correctly
- Make sure you ran `supabase/schema.sql` in Supabase SQL Editor

---

**Need more help?** See [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
