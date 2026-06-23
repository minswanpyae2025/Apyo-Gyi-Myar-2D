# အပျိုကြီးများ 2D - Deployment Guide

This guide provides step-by-step instructions on deploying the **အပျိုကြီးများ 2D** application using **Vercel** for hosting and **Supabase** as the backend database and authentication provider.

## 1. Supabase Setup (Backend & Auth)

Supabase provides the PostgreSQL database and user authentication for the app.

### Create a Project
1. Go to [Supabase](https://supabase.com/) and sign in.
2. Click **New Project**, select an organization, name the project (e.g., "apyo-gyi-myar-2d"), set a secure database password, and choose a region.
3. Wait a few minutes for the project to provision.

### Enable Authentication
1. In your Supabase project dashboard, navigate to **Authentication** -> **Providers**.
2. Make sure **Email** is enabled.
3. You can disable "Confirm email" if you want admins to log in immediately upon creation.

### Database Schema and Security Setup
The required database tables and Row Level Security (RLS) policies are provided as SQL migration files.

You can apply these either via the Supabase CLI, or by copying and pasting the contents into the **SQL Editor** in your Supabase dashboard.

1.  **Initial Schema:** Open `supabase/migrations/20240101000000_initial_schema.sql` and run it in the SQL Editor to create the `profiles`, `bets`, `results`, and `audit_logs` tables.
2.  **RLS Policies:** Open `supabase/migrations/20240101000001_rls_policies.sql` and run it in the SQL Editor. This is **critical** for securing your database and ensuring only authenticated admins can insert or read data appropriately.

### Get Supabase Keys
1. Navigate to **Project Settings** -> **API**.
2. Copy the **Project URL** and the **anon `public` API Key**. You will need these for the `.env` variables.

---

## 2. Vercel Setup (Frontend Deployment)

Vercel is the recommended platform for deploying Vite/React applications.

### Prerequisites
- Push your application code to a GitHub, GitLab, or Bitbucket repository.

### Deployment Steps
1. Go to [Vercel](https://vercel.com/) and sign in.
2. Click **Add New** -> **Project**.
3. Import your GitHub repository that contains the "အပျိုကြီးများ 2D" code.
4. Configure the project:
   - **Framework Preset**: Vercel should automatically detect **Vite**. If not, select it.
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Configure Environment Variables:
   Expand the **Environment Variables** section and add the keys from Supabase:
   - `VITE_SUPABASE_URL`: Paste your Supabase Project URL.
   - `VITE_SUPABASE_ANON_KEY`: Paste your Supabase `anon` API Key.
6. Click **Deploy**.

Vercel will build the app and provide you with a live URL once completed. Your **အပျိုကြီးများ 2D** application is now in production!
