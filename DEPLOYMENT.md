# SokoLink Production Deployment Guide
## Render (Backend API) + Neon (Serverless PostgreSQL) + Vercel (Frontend Web App)

This guide walks you through deploying **SokoLink** into production using the recommended architecture:
- **Database:** [Neon Serverless PostgreSQL](https://neon.tech) (High-speed serverless Postgres with connection pooling)
- **Backend API:** [Render](https://render.com) (Node.js Express + Prisma 7 Web Service)
- **Frontend App:** [Vercel](https://vercel.com) (Next.js 16 App Router with automated CDN & edge caching)

---

## Architecture Overview

```
                      ┌───────────────────────────────────────┐
                      │            Vercel (Frontend)          │
                      │         Next.js 16 App Router         │
                      │     https://sokolink.vercel.app       │
                      └──────────────────┬────────────────────┘
                                         │
              Proxy /api/* calls (Next.js Rewrites) or Direct Fetch
                                         │
                                         ▼
                      ┌───────────────────────────────────────┐
                      │             Render (Backend)          │
                      │        Express.js + TypeScript        │
                      │  https://sokolink-backend.onrender.com│
                      └──────────────────┬────────────────────┘
                                         │
                      Connection Pooled / Direct Migrations
                                         │
                                         ▼
                      ┌───────────────────────────────────────┐
                      │             Neon Database             │
                      │         Serverless PostgreSQL         │
                      │    ep-xyz-pooler.aws.neon.tech        │
                      └───────────────────────────────────────┘
```

---

## Step 1: Set Up Neon Serverless PostgreSQL

1. **Sign in to Neon:**
   - Go to [neon.tech](https://neon.tech) and sign up / log in.
2. **Create a New Project:**
   - Click **"New Project"**.
   - Project Name: `sokolink-db`
   - Postgres Version: `16` or `17` (latest recommended).
   - Region: Select the region nearest your users (e.g. `AWS eu-central-1 Frankfurt` or `AWS us-east-2 Ohio`).
3. **Copy your Connection Strings from the Dashboard:**
   Neon provides two critical connection strings in the **Connection Details** box:

   - **Pooled connection string** (Used for application queries):
     Enable **"Connection pooling"** toggle.
     ```
     postgresql://[user]:[password]@[endpoint]-pooler.[region].aws.neon.tech/sokolink?sslmode=require
     ```
     👉 Save this as **`DATABASE_URL`**.

   - **Direct connection string** (Used for schema migrations & `prisma db push`):
     Disable **"Connection pooling"** toggle (port 5432).
     ```
     postgresql://[user]:[password]@[endpoint].[region].aws.neon.tech/sokolink?sslmode=require
     ```
     👉 Save this as **`DIRECT_URL`**.

4. **Initialize Database Schema from Local Terminal (Optional Fast Push):**
   You can push the schema directly to your Neon database now:
   ```bash
   cd backend
   DIRECT_URL="<your_neon_direct_url>" DATABASE_URL="<your_neon_pooled_url>" npx prisma db push
   ```
   *(Render will also automatically run `prisma db push` upon startup).*

---

## Step 2: Deploy Backend to Render

You can deploy using either the **Render Blueprint (`render.yaml`)** or as a **Manual Web Service**.

### Option A: Automatic Deployment using Render Blueprint (`render.yaml`)
1. In [dashboard.render.com](https://dashboard.render.com), click **"New +"** -> **"Blueprint"**.
2. Connect your GitHub repository: `0708818064/Sokolink`.
3. Render reads `render.yaml` automatically from the root.
4. Fill in the required environment variables prompted by Render:
   - `DATABASE_URL`: Your Neon pooled connection string.
   - `DIRECT_URL`: Your Neon direct connection string.
   - `CORS_ORIGIN`: Your Vercel frontend URL (or `*` during initial launch).
   - `FRONTEND_URL`: Your Vercel frontend URL (e.g., `https://sokolink.vercel.app`).
5. Click **"Apply"**. Render will build and deploy your backend.

### Option B: Manual Web Service Creation
1. In Render Dashboard, click **"New +"** -> **"Web Service"**.
2. Select your repository `0708818064/Sokolink`.
3. Configure the service settings:
   - **Name:** `sokolink-backend`
   - **Region:** Same or close to your Neon database region.
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:**
     ```bash
     npm install && npx prisma generate && npm run build
     ```
   - **Start Command:**
     ```bash
     npm run deploy:start
     ```
   - **Health Check Path:** `/api/health`
4. Add **Environment Variables**:
   | Variable | Value | Notes |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Production mode |
   | `PORT` | `10000` | Render standard port |
   | `DATABASE_URL` | `postgresql://...-pooler...neon.tech/sokolink?sslmode=require` | Neon pooled URL |
   | `DIRECT_URL` | `postgresql://......neon.tech/sokolink?sslmode=require` | Neon direct URL |
   | `JWT_SECRET` | `openssl rand -base64 32` | 32+ char secret |
   | `CORS_ORIGIN` | `https://your-frontend.vercel.app` | Vercel domain or `*` |
   | `FRONTEND_URL`| `https://your-frontend.vercel.app` | Vercel domain |
   | `MPESA_ENVIRONMENT` | `sandbox` | `sandbox` or `production` |
   | `MPESA_CONSUMER_KEY` | `your_daraja_key` | From Safaricom portal |
   | `MPESA_CONSUMER_SECRET` | `your_daraja_secret` | From Safaricom portal |
   | `MPESA_PASSKEY` | `your_passkey` | Daraja Passkey |
   | `MPESA_SHORTCODE` | `174379` | Till or Paybill |
   | `MPESA_CALLBACK_URL` | `https://sokolink-backend.onrender.com/api/payments/mpesa/callback` | Callback URL |
5. Click **"Deploy Web Service"**.
6. When deployment finishes, copy your Render URL:
   `https://sokolink-backend.onrender.com`
7. Verify by visiting `https://sokolink-backend.onrender.com/api/health` in your browser. You should receive:
   ```json
   {"status":"ok","service":"sokolink-backend-api","version":"1.0.0"}
   ```

---

## Step 3: Deploy Frontend to Vercel

1. **Sign in to Vercel:**
   - Go to [vercel.com](https://vercel.com) and log in with GitHub.
2. **Import Project:**
   - Click **"Add New..."** -> **"Project"**.
   - Select your GitHub repository: `0708818064/Sokolink`.
3. **Configure Project Settings:**
   - **Framework Preset:** `Next.js`
   - **Root Directory:** Click "Edit" and choose `frontend` (or leave default if configuring monorepo).
   - **Build Command:** `prisma generate && next build`
   - **Install Command:** `npm install`
4. **Configure Environment Variables in Vercel:**
   Add the following variables:
   | Variable | Value | Notes |
   | :--- | :--- | :--- |
   | `BACKEND_API_URL` | `https://sokolink-backend.onrender.com` | Your deployed Render URL |
   | `NEXT_PUBLIC_API_URL` | `https://sokolink-backend.onrender.com/api` | Direct API endpoint |
   | `DATABASE_URL` | `postgresql://...-pooler...neon.tech/sokolink?sslmode=require` | Neon pooled URL (for SSR) |
   | `DIRECT_URL` | `postgresql://......neon.tech/sokolink?sslmode=require` | Neon direct URL |
   | `JWT_SECRET` | *(Same secret as in Render backend)* | Critical for auth tokens |
   | `NEXTAUTH_SECRET` | *(Same secret as JWT_SECRET)* | Session cookie security |
   | `NEXT_PUBLIC_APP_URL` | `https://your-project.vercel.app` | Production site URL |
   | `NEXTAUTH_URL` | `https://your-project.vercel.app` | Site URL |
5. Click **"Deploy"**.
6. Vercel will build and assign you a production URL (e.g. `https://sokolink.vercel.app`).

---

## Step 4: Final Linkage & Verification

1. **Update Render Backend CORS with your Vercel URL:**
   - In your Render dashboard, navigate to `sokolink-backend` -> **Environment**.
   - Set `CORS_ORIGIN` to your actual Vercel domain: `https://your-project.vercel.app`.
   - Set `FRONTEND_URL` to `https://your-project.vercel.app`.
   - Click **Save Changes** (Render will automatically redeploy).

2. **Verify End-to-End Functionality:**
   - Open your Vercel URL in your browser: `https://your-project.vercel.app`.
   - **Quick Checkout:** Test ordering an item with the floating quick checkout modal.
   - **Admin Portal:** Log in at `/admin/login` (default admin created during seed or create one).
   - **SME Portal:** Register a merchant account at `/register` and test listing a product.
   - **Rider Fleet:** Check rider assignment workflow.
   - **APK Download:** Download the Android APK via the floating download button or `/downloads/sokolink.apk`.

---

## Maintenance & Common Troubleshooting

### 1. Database Connection Timeout on Neon
- Neon databases automatically spin down when inactive. The first query after spin-down may take ~1.5s to wake up.
- Always use the **pooled connection string** (`-pooler`) for `DATABASE_URL` to allow instant connection multiplexing.

### 2. CORS Errors in Browser Console
- Ensure `CORS_ORIGIN` on Render includes your exact Vercel domain without trailing slashes (e.g. `https://sokolink.vercel.app`).
- Next.js rewrites (`frontend/next.config.ts`) automatically route `/api/*` requests on the same origin to avoid cross-site cookie restrictions.

### 3. M-Pesa STK Push Sandbox Testing
- When testing Safaricom Daraja STK Push, test phone numbers must be valid Kenyan format `2547XXXXXXXX`.
- Render service URL must be public HTTPS for Safaricom to deliver the callback payload to `/api/payments/mpesa/callback`.
