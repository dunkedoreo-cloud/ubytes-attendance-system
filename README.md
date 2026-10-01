# 🎴 UByTeS RFID Attendance Management System

> **Young Thinkers Society (UByTeS) • University of Bohol**  
> An automated, high-speed RFID attendance logging, student directory management, and real-time cloud-sync system.

---

## ✨ Features

- **⚡ Instant RFID Tap Logging**: Rapid attendance registration via USB RFID / NFC card readers with automated Time-In and Time-Out tracking.
- **🔊 Audio & Visual Feedback**: Web Audio API synthesized chimes for successful scans, late arrival warnings, duplicate scans, and unregistered cards.
- **📶 Offline-First Resilience**: Full operational capability without internet access using browser local storage; zero disruption during campus connectivity drops.
- **☁️ Supabase Cloud Synchronization**: Real-time multi-device sync, live Supabase channels, and bulk cloud push/pull capabilities.
- **📊 Real-Time Analytics & Radar**: Visual event turnout metrics, late arrival rates, department/program breakdown, and interactive attendance heatmaps.
- **👥 Student Directory & Continuous Registration**: Bulk CSV import/export, student card pairing, and batch member registration with photo avatars.
- **🛡️ Multi-Admin Security**: Role-based access control with PIN protection, persistent admin accounts, and credential switching.
- **📊 Google Sheets Export**: Direct automated sync to Google Sheets via Google Apps Script webhooks.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18+ or 20+ recommended)
- A standard USB RFID/NFC card reader (operates as a standard HID keyboard wedge)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/<YOUR-USERNAME>/ubytes-attendance-system.git
   cd ubytes-attendance-system
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open your browser at `http://localhost:5173`.

---

## 🌐 Deploying to GitHub Pages

This repository comes pre-configured with **GitHub Actions** for zero-config automated deployment:

1. Create a new repository on [GitHub](https://github.com/new) named `ubytes-attendance-system`.
2. Push your code to the `main` branch:
   ```bash
   git remote add origin https://github.com/<YOUR-USERNAME>/ubytes-attendance-system.git
   git branch -M main
   git push -u origin main
   ```
3. In your GitHub repository:
   - Go to **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, select **GitHub Actions**.
4. The workflow will automatically compile the Vite application and publish it live!

---

## ☁️ Cloud Database Setup (Optional - Supabase)

To enable multi-device sync across different laptops or phones:
1. Create a free project at [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in Supabase and execute the script in [`supabase_schema.sql`](./supabase_schema.sql).
3. In the live web app, click **Cloud Sync** in the top navigation bar and enter your Supabase **Project URL** and **Anon Key**.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript
- **Bundler**: Vite
- **Styling**: Tailwind CSS + Lucide React Icons
- **Backend / Database**: Supabase (PostgreSQL + Realtime WebSockets)
- **Sound**: Web Audio API synthesizer
- **Deployment**: GitHub Pages via GitHub Actions

---

## 📄 License

Developed for the **Young Thinkers Society (UByTeS)**. All rights reserved.
