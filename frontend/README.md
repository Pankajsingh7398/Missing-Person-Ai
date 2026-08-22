# 🧠 Missing Person AI — Frontend

> **React + Vite** dashboard for the Missing Person AI Detection System.  
> Powered by CCTV intelligence, AI face recognition, and Clerk authentication.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Authentication](#authentication)
- [Features](#features)
- [Scripts](#scripts)
- [Team Collaboration](#team-collaboration)

---

## 🌐 Overview

The frontend provides a modern, dark-themed dashboard for law enforcement and investigation teams to:

- Manage **missing person cases**
- Upload and analyze **CCTV footage** using AI face recognition
- Track **sightings** and **alerts** in real time
- Authenticate securely via **Clerk** (email/password + Google OAuth)

---

## 🛠 Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| [React](https://react.dev) | 19 | UI framework |
| [Vite](https://vitejs.dev) | 7 | Build tool & dev server |
| [Clerk](https://clerk.com) | 5+ | Authentication (Sign In, Sign Up, Google OAuth) |
| Vanilla CSS | — | Styling (dark forest-green theme) |

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── App.jsx              # Main dashboard & routing logic
│   ├── App.css              # App-level styles
│   ├── cases.jsx            # Cases management page
│   ├── CaseDetails.jsx      # Individual case detail view
│   ├── api.js               # Backend API calls
│   ├── main.jsx             # React entry point + ClerkProvider
│   ├── index.css            # Global styles (design system)
│   └── components/
│       └── auth/
│           ├── SignIn.jsx         # Sign In page
│           ├── SignUp.jsx         # Sign Up page
│           ├── ForgotPassword.jsx # Password reset flow
│           └── LogoutModal.jsx    # Logout confirmation modal
├── index.html               # HTML entry point
├── vite.config.js           # Vite configuration
├── package.json             # Dependencies
├── .env.example             # Environment variable template
└── .env.local               # Your local secrets (NOT committed)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18 or higher
- A [Clerk](https://dashboard.clerk.com) account and application

### 1. Clone the repository

```bash
git clone https://github.com/imyagyeshsingh/Missing-Person-Ai.git
cd Missing-Person-Ai/frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and add your real Clerk publishable key:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_real_key_here
```

> Get your key from [dashboard.clerk.com](https://dashboard.clerk.com) → Your App → **API Keys**

### 4. Start the development server

```bash
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | ✅ Yes | Clerk publishable key (starts with `pk_test_` or `pk_live_`) |

> ⚠️ **Never** add `CLERK_SECRET_KEY` to the frontend. Secret keys are backend-only.

---

## 🔐 Authentication

Authentication is handled by **Clerk**. The following flows are implemented:

| Flow | Description |
|---|---|
| Sign In | Email + password authentication |
| Sign Up | Account creation with email verification |
| Forgot Password | Email-based password reset with OTP |
| Google OAuth | One-click sign in / sign up with Google |
| Logout | Confirmation modal → Clerk `signOut()` |

### Enabling Google OAuth

1. Go to [Clerk Dashboard](https://dashboard.clerk.com) → **User & Authentication** → **Social connections**
2. Enable **Google**
3. For development, Clerk provides a shared OAuth key — no Google Cloud Console setup needed

### Password Policy

- Minimum **8 characters** required
- Set in Clerk Dashboard → **User & Authentication** → **Email, Phone, Username** → Password settings

---

## ✨ Features

- 🗂 **Case Management** — Create, view, and manage missing person cases
- 📹 **CCTV Analysis** — Upload video footage and run AI face matching
- 👤 **Person Profiles** — Reference photos, age, gender, last seen location
- 🔔 **Live Alerts** — Real-time sighting notifications
- 📊 **Reports** — Investigation summaries and analysis results
- 🌙 **Dark Theme** — Deep forest-green UI with lime accent
- 📱 **Responsive** — Works on desktop and tablet

---

## 📜 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server at `http://localhost:5173` |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |

---

## 👥 Team Collaboration

This project is a collaboration between:

- [@Pankajsingh7398](https://github.com/Pankajsingh7398) — Authentication, UI theme, Clerk integration
- [@imyagyeshsingh](https://github.com/imyagyeshsingh) — AI face recognition, CCTV backend, ArcFace model

### For new team members:

1. Clone the repo
2. Copy `.env.example` → `.env.local`
3. Ask the team for the Clerk publishable key (shared privately, not in git)
4. Run `npm install && npm run dev`

---

## 🔗 Related

- [Backend README](../backend/README.md) — FastAPI backend setup
- [Clerk Docs](https://clerk.com/docs) — Authentication documentation
- [Vite Docs](https://vitejs.dev/guide/) — Build tool documentation
