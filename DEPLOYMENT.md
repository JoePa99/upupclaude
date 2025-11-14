# Deployment Checklist

Ready to deploy upupdnd to production! Here's your complete checklist.

## ✅ What's Built

- [x] Beautiful warm dark UI with distinctive design
- [x] Authentication pages (sign in / sign up)
- [x] Workspace setup flow
- [x] Database schema with pgvector
- [x] Protected routes with auth checking
- [x] API routes for workspace creation
- [x] Type-safe Supabase integration
- [x] Vercel build configuration

## 🚀 Deployment Steps

### 1. Set Up Supabase (10 minutes)

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Name it "upup-prod" (or similar)
   - Choose region close to your users
   - Set strong database password
   - Wait ~2 minutes for provisioning

2. **Run Database Schema**
   - In Supabase dashboard → **SQL Editor**
   - Click "New Query"
   - Copy entire contents of `supabase/schema.sql`
   - Paste and click **Run**
   - Verify: You should see all tables created

3. **Configure Storage Buckets**
   - Go to **Storage** in Supabase
   - Create these buckets (all private):
     - `company-os-docs`
     - `agent-docs`
     - `playbook-docs`
     - `avatars` (make this public)

4. **Get API Keys**
   - Go to **Settings → API**
   - Copy these values:
     - Project URL: `https://xxxxx.supabase.co`
     - anon/public key: `eyJhbGc...`
     - service_role key: `eyJhbGc...` (keep secret!)

### 2. Deploy to Vercel (5 minutes)

1. **Push to GitHub**
   ```bash
   # Already done! Your code is on:
   # claude/planning-and-discussion-012LbwYzxgLbn7HYc2V9PdYa branch
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New" → "Project"
   - Import your GitHub repo
   - Select the branch

3. **Add Environment Variables**

   In Vercel project settings → Environment Variables:

   ```bash
   # Supabase (required)
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

   # AI Providers (add later when ready)
   OPENAI_API_KEY=sk-...
   ANTHROPIC_API_KEY=sk-ant-...
   GOOGLE_AI_API_KEY=...
   COHERE_API_KEY=...
   ```

4. **Deploy!**
   - Click "Deploy"
   - Build should succeed ✅
   - Your app will be live at `your-project.vercel.app`

### 3. Test Deployment (5 minutes)

1. **Visit Your App**
   - Go to `https://your-project.vercel.app`
   - Should redirect to `/auth/signin`

2. **Sign Up**
   - Click "Sign up"
   - Fill in:
     - Your name
     - Workspace name (e.g., "Test Workspace")
     - Email
     - Password (min 8 chars)
   - Click "Create workspace"

3. **Verify Setup Flow**
   - Should see animated setup page
   - Should auto-redirect to main app after 2 seconds
   - Should see #general channel
   - Should see mock conversation data

4. **Test Authentication**
   - Sign out (if implemented)
   - Try signing back in
   - Should persist session

## ✅ Post-Deployment

### Immediate Next Steps

**1. Configure Email Templates**
   - Supabase → Authentication → Email Templates
   - Customize confirmation email (optional)
   - Add your SMTP server for branded emails (optional)

**2. Set Up Custom Domain (optional)**
   - Vercel → Settings → Domains
   - Add your custom domain
   - Update DNS records

**3. Enable Auth Providers (optional)**
   - Supabase → Authentication → Providers
   - Enable Google, GitHub, etc.
   - Configure OAuth credentials

### What Works Now

✅ **User can:**
- Sign up and create workspace
- Sign in to existing account
- See protected main app
- View channels (mock data)
- See mock conversation

⏳ **Still TODO:**
- Real-time messaging
- Actual message sending
- CompanyOS upload
- Assistant creation
- Context retrieval / AI responses
- Billing integration

## 🔍 Troubleshooting

### Build Fails on Vercel

**Error: "Tailwind PostCSS plugin not found"**
- Solution: Already fixed (using Tailwind v3.4.1)

**Error: "Module not found: @supabase/ssr"**
- Solution: Check `package.json` includes `@supabase/ssr`
- Run `npm install` locally to verify

### Auth Not Working

**Redirects to /auth/signin in loop**
- Check: Environment variables are set in Vercel
- Check: Supabase URL and keys are correct
- Check: Database schema has been run

**Signup fails with "User already exists"**
- This is normal if you've signed up before
- Use different email or sign in instead

**Setup page shows "Failed to create workspace"**
- Check browser console for error
- Check Vercel function logs
- Verify database schema is correct
- Verify RLS policies are set

### Database Issues

**Error: "relation 'users' does not exist"**
- Solution: Run `supabase/schema.sql` in SQL Editor

**Error: "permission denied for table users"**
- Solution: Check RLS policies are created
- Solution: Verify service_role key is correct

**Vector search not working**
- Check: pgvector extension enabled
- Run: `create extension if not exists vector;`

## 📊 What to Monitor

Once deployed, keep an eye on:

**Vercel Dashboard:**
- Build success/failures
- Function execution time
- Bandwidth usage

**Supabase Dashboard:**
- Database size (free tier: 500MB)
- Storage usage (free tier: 1GB)
- API requests
- Auth users

**When to Upgrade:**
- Database approaching 500MB → Supabase Pro ($25/mo)
- Need more compute → Vercel Pro ($20/mo)
- Need custom domain + team features

## 🎯 Production Readiness Checklist

Before inviting real users:

- [ ] Custom domain configured
- [ ] Email confirmation enabled
- [ ] Terms of Service page
- [ ] Privacy Policy page
- [ ] Error monitoring (Sentry/LogRocket)
- [ ] Analytics (PostHog/Mixpanel)
- [ ] Backup strategy
- [ ] Rate limiting on API routes
- [ ] CORS policies set
- [ ] CSP headers configured

## 🚢 Ship It!

Your beautiful, distinctive AI collaboration platform is ready to deploy.

Current features:
- ✨ Gorgeous warm dark theme
- 🔐 Secure authentication
- 🏢 Multi-tenant workspaces
- 💾 Vector-ready database
- 🎨 Distinctive design (no AI slop!)

Next phase: Make the assistants actually work! 🤖

---

**Questions?** Check:
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Troubleshooting](https://vercel.com/docs/troubleshooting)
