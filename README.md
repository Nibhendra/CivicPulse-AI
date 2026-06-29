<div align="center">
  <img src="public/logo.png" alt="CivicPulse AI Logo" width="120" />
  <h1>CivicPulse AI</h1>
  <p><strong>AI-Powered Hyperlocal Civic Issue Resolver</strong></p>
</div>

<p align="center">
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-blue.svg?style=flat-square&logo=react" alt="React"></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind-CSS-38B2AC.svg?style=flat-square&logo=tailwind-css" alt="Tailwind"></a>
  <a href="https://firebase.google.com/"><img src="https://img.shields.io/badge/Firebase-Firestore-FFCA28.svg?style=flat-square&logo=firebase" alt="Firebase"></a>
  <a href="https://ai.google.dev/"><img src="https://img.shields.io/badge/Gemini-2.5_Flash-4285F4.svg?style=flat-square&logo=google" alt="Gemini"></a>
</p>

---

**CivicPulse AI** is a dual-platform web application that bridges the gap between citizens and city authorities using generative AI. 

When citizens report local infrastructure issues (potholes, garbage, broken streetlights), our integrated **Gemini AI Agent** visually analyzes the photo, determines the severity, extracts text/graffiti, and automatically routes the issue to the correct municipal department—creating a frictionless experience for citizens and an organized, actionable dashboard for authorities.

Built for the **"Community Hero – Hyperlocal Problem Solver"** hackathon.

---

## ✨ Key Features

### 👤 For Citizens
- **Frictionless Reporting:** Drop a pin on an interactive map and snap a photo. AI does the rest.
- **Smart Validation:** The Gemini AI instantly analyzes the image to ensure it's a valid civic issue, preventing spam.
- **Live Timeline Tracking:** Track the exact status of your report (Submitted → Under Review → In Progress → Resolved).
- **Gamified Trust System:** Earn "Trust Score" points for reporting valid, high-priority issues that get verified by authorities.

### 🏛️ For Authorities (Role-Based Access)
- **AI-Assisted Triage:** The dashboard automatically sorts issues by AI-determined Severity (Critical/High/Medium/Low).
- **Auto-Routing:** The AI suggests the exact municipal department (e.g., Department of Transportation, Sanitation) based on visual evidence.
- **Action Management:** Update statuses with a single click, append internal department action notes, and automatically broadcast progress to the citizen timeline.
- **SLA Badges:** Visually identify overdue or unattended issues.

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite |
| **Styling** | Tailwind CSS, shadcn/ui primitives |
| **Auth** | Firebase Authentication (Google) |
| **Database** | Cloud Firestore |
| **AI Engine** | Google Gemini SDK (`gemini-2.5-flash`) |
| **Backend** | Express.js / Vercel Serverless Functions |
| **Maps** | Leaflet.js + OpenStreetMap |
| **Deployment** | Vercel |

---

## ⚡ Local Setup

### 1. Clone & Install
```bash
git clone https://github.com/your-username/CivicPulse-AI.git
cd CivicPulse-AI
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
GEMINI_API_KEY=your_google_ai_studio_key
```

### 3. Run the Development Servers
You must run both the Vite frontend and the Express AI backend concurrently:
```bash
npm run dev:full
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`

---

## 🏗️ Architecture & Security

* **Secure AI Proxy:** The Gemini SDK is executed strictly on the Node.js backend (or Vercel Serverless Function). API keys are never exposed to the client browser.
* **Firestore Rules:** Strict RBAC ensures that only users with whitelisted admin emails can update issue statuses or access the Authority Dashboard.
* **SPA Routing:** Configured natively for Vercel using `vercel.json` to handle React Router client-side routes effortlessly.

* Project Link - https://civic-pulse-ai-iota.vercel.app/
User Demo Link - https://drive.google.com/file/d/1KbqUM8nRgyMAFmmb-PQzqxNyelqCmWTy/view?usp=drive_link
Admin Demo Link - https://drive.google.com/file/d/1OzdVfpN5JMPNrpKHeEOvKLho104v2cWm/view?usp=drive_link

---
*Created with ❤️ for smarter, cleaner cities.*
