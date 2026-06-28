# 🛡️ CivicPulse AI

> AI-Powered Hyperlocal Civic Issue Resolver

**CivicPulse AI** is a mobile-first Progressive Web App (PWA) that empowers citizens to report and track civic infrastructure issues like potholes, broken roads, garbage dumps, open drains, and more. A Gemini-powered AI agent analyzes each report to classify severity, detect duplicates, assign departments, and generate formal complaint drafts.

Built for the **"Community Hero – Hyperlocal Problem Solver"** hackathon.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS v3, shadcn/ui |
| Auth | Firebase Authentication (Google + Email/Password) |
| Database | Cloud Firestore |
| Storage | Cloudinary (unsigned uploads) |
| AI | Gemini API (server-side only) |
| Maps | Leaflet.js + OpenStreetMap |
| Deployment | Vercel (free tier) |

---

## 📋 Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- A **Firebase project** (free Spark plan)
- A **Gemini API key** from [Google AI Studio](https://aistudio.google.com/)

---

## ⚡ Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/your-username/civicpulse-ai.git
cd civicpulse-ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your Firebase config and Gemini API key:

```env
# Firebase (from Firebase Console → Project Settings → Web App)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc

# Cloudinary (for image uploads)
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_cloudinary_upload_preset

# Gemini (server-side only — never exposed to frontend)
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
GEMINI_FALLBACK_MODEL=gemini-2.5-flash-lite
```

### 4. Set up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable **Authentication** → Sign-in providers:
   - Google
   - Email/Password
4. Create a **Cloud Firestore** database (start in test mode, then apply rules)
5. Create a **Cloudinary** account, get cloud name, and set up an unsigned upload preset
6. Copy your web app config and Cloudinary details to `.env.local`

### 5. Start development server

```bash
npm run dev
```

The app will be running at `http://localhost:5173`

---

## 📁 Project Structure

```
civicpulse-ai/
├── public/              # Static assets + PWA manifest
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── ui/          # shadcn/ui primitives
│   │   ├── layout/      # AppShell, Header, BottomNav
│   │   └── auth/        # Login, Google Sign-In, ProtectedRoute
│   ├── pages/           # Route-level page components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Firebase config, API client, utilities
│   ├── types/           # TypeScript interfaces
│   ├── constants/       # App config, categories
│   └── styles/          # Tailwind CSS entry
├── server/              # Express API (Gemini proxy) — Phase 2+
├── firestore.rules      # Firestore security rules
└── .env.example         # Environment variable template
```

---

## 🏗️ Build Phases

- [x] **Phase 1**: Foundation — Vite, Tailwind, Auth, Layout, Routing
- [x] **Phase 2**: Issue Reporting — Image upload, location picker, form
- [ ] **Phase 3**: Civic Rescue Agent — Gemini AI pipeline
- [ ] **Phase 4**: Issue Detail & Tracking — Timeline, comments, upvotes
- [ ] **Phase 5**: Map & Discovery — Leaflet map, clustering, filters
- [ ] **Phase 6**: Gamification — Trust scores, leaderboard
- [ ] **Phase 7**: Polish & Deploy — PWA, animations, production build

## 🚀 Deployment (Vercel)

CivicPulse AI is configured to run out-of-the-box on Vercel's free tier, utilizing Serverless Functions for the Express API.

### 1. Push to GitHub
Ensure all your code is committed and pushed to your GitHub repository:
```bash
git push -u origin main
```

### 2. Import to Vercel
1. Log into [Vercel](https://vercel.com/) and click **Add New → Project**.
2. Import your GitHub repository (`CivicPulse-AI`).
3. Vercel will auto-detect Vite as the framework.

### 3. Configure Environment Variables
In the Vercel project settings during import, add the following environment variables (from your `.env.local` and `server/.env`):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_CLOUDINARY_UPLOAD_PRESET`
- `GEMINI_API_KEY` (Your actual Google AI Studio key)
- `GEMINI_MODEL` (e.g., `gemini-2.5-flash`)
- `GEMINI_FALLBACK_MODEL` (e.g., `gemini-2.5-flash-lite`)

*Note: Do NOT set `VITE_API_BASE_URL` on Vercel. Leaving it blank allows the app to correctly use relative `/api` paths for Serverless Functions.*

### 4. Deploy
Click **Deploy**. Vercel will run `npm run build` and provision the serverless functions via `vercel.json` and `api/index.ts`.

### 5. Update Firebase Authorized Domains
Once deployed, Vercel will give you a domain (e.g., `civicpulse-ai.vercel.app`).
1. Go to the **Firebase Console**.
2. Navigate to **Authentication → Settings → Authorized domains**.
3. Add your new Vercel domain to allow Google/Email sign-ins to work in production.

### ✅ Production Checklist
- [ ] Firebase Authentication authorized domains updated
- [ ] Cloudinary unsigned upload preset is active
- [ ] Firestore rules deployed (`firebase deploy --only firestore:rules`)
- [ ] Firestore indexes deployed (`firebase deploy --only firestore:indexes`)
- [ ] Gemini API key is securely stored in Vercel env variables
- [ ] `/api/process-issue` returns JSON when tested
- [ ] React Router pages (e.g., `/report`, `/map`) work properly on direct reload (SPA fallback)

---

MIT
