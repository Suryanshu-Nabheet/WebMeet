<div align="center">
  <img src="/Frontend/public/banner.svg" alt="WebMeet Logo" width="90" />
  <h1 style="font-size: 2.8rem; font-weight: 800; background: linear-gradient(90deg, #ffffff, #3b82f6); -webkit-background-clip: text; color: transparent; margin-top: 10px;">
    WebMeet
  </h1>
  <p style="font-size: 1.2rem; color: #64748b; margin-top: -10px;">
    A modern, production-ready platform for live study sessions, classrooms, and collaboration
  </p>
</div>

<div align="center">
  
  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  [![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
  
</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Highlights](#highlights)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [License](#license)
- [Contact](#contact)

---

## 🎯 Overview

WebMeet combines a clean marketing site, a focused meeting experience, and a hardened signaling layer to make remote studying feel as close to in-person as possible. Built on top of WebRTC, it delivers high-quality real-time communication with modern web technologies.

---

## ✨ Highlights

- **🎥 High-quality video & audio** – WebRTC + Simple-Peer with fine-tuned connection settings
- **🎨 Interactive rooms** – Live video grid, chat, and presence in a single unified experience
- **👑 Host controls** – End meeting for everyone, remove participants, and manage room state
- **📊 Real-time telemetry** – Bitrate, RTT, and jitter surfaced in the UI for quick diagnostics
- **🚀 Render-ready** – Single Node service that runs both the Next.js app and the Socket.io signaling server

---

## 🛠️ Tech Stack

<div align="center">

### Frontend

<table>
  <tr>
    <td align="center" width="96">
      <img src="/Frontend/public/nextjs.svg" width="48" height="48" alt="Next.js" />
      <br>Next.js 14
    </td>
    <td align="center" width="96">
      <img src="/Frontend/public/typescript.svg" width="48" height="48" alt="TypeScript" />
      <br>TypeScript
    </td>
    <td align="center" width="96">
      <img src="/Frontend/public/tailwindcss.svg" width="48" height="48" alt="Tailwind CSS" />
      <br>Tailwind CSS
    </td>
    <td align="center" width="96">
      <img src="/Frontend/public/framer-motion.svg" width="48" height="48" alt="Framer Motion" />
      <br>Framer Motion
    </td>

  </tr>
</table>

### Backend & Real-time

<table>
  <tr>
    <td align="center" width="96">
      <img src="/Frontend/public/nodejs.svg" width="48" height="48" alt="Node.js" />
      <br>Node.js
    </td>
    <td align="center" width="96">
      <img src="/Frontend/public/webrtc.svg" width="48" height="48" alt="WebRTC" />
      <br>WebRTC
    </td>
  </tr>
</table>

</div>

---

## 🏗️ Architecture

WebMeet is organized as a small monorepo with two workspaces and a unified runtime server:

- **Frontend** – Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Framer Motion
- **Signaling backend** – Socket.io based signaling server for WebRTC (no database required)
- **Unified server** – A custom `server.ts` entrypoint at the repo root that:
  - Boots the Next.js application from `Frontend/`
  - Attaches Socket.io (via `SocketServer`) to the same HTTP server and port

This means you can deploy WebMeet as **one Node service** (e.g., a single Render web service) and still keep the codebase cleanly separated into Frontend and Backend.

---

## 📁 Project Structure

```text
WebMeet/
├── Frontend/               # Next.js application (UI)
│   ├── app/                # App Router pages & layouts
│   ├── components/         # UI, chat, layout, video components
│   ├── config/             # Frontend config & env helpers
│   ├── lib/                # WebRTC + socket client utilities
│   ├── store/              # Zustand store (room/participants/network)
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
│
├── Backend/                # Socket.io signaling server
│   ├── index.ts            # (standalone) server entrypoint
│   ├── socketServer.ts     # Core Socket.io logic
│   ├── config/             # Backend environment config
│   └── package.json        # Backend dependencies
│
├── server.ts               # Unified Next.js + Socket.io HTTP server
├── package.json            # Root workspace + deployment scripts
└── render.yaml             # Optional Render IaC configuration
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js **18+**
- npm (recommended) or yarn/pnpm

### Install Dependencies

```bash
git clone https://github.com/Suryanshu-Nabheet/WebMeet.git
cd WebMeet
npm install
```

### Local Development

There are two common ways to run WebMeet locally.

#### Option 1: Separate Dev Servers (Recommended - Clearer Logs)

**Terminal 1** – Socket.io signaling server:

```bash
npm run server
```

**Terminal 2** – Next.js app (frontend):

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) and create or join a room.

In this mode:

- Frontend dev server runs on `http://localhost:3000`
- Signaling server listens on `http://localhost:3001` (default)

#### Option 2: Production-like Unified Server

To run the same setup you use in production (one Node process running both UI + signaling):

```bash
npm run build   # Build the Next.js app
npm start       # Runs server.ts using tsx
```

This uses the unified `server.ts` entrypoint and listens on `PORT` (or `3000` if not set).

---

## ⚙️ Configuration

### Environment Variables

Default local setup works **without any env vars**:

- Frontend dev: `http://localhost:3000`
- Signaling dev: `http://localhost:3001`

You can optionally create a `.env.local` file in `Frontend/` to override client-side values:

```env
# Frontend (client)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# If not set in development, defaults to http://localhost:3001
NEXT_PUBLIC_SOCKET_PORT=3001

# Optional TURN server for stricter networks
# NEXT_PUBLIC_TURN_SERVER_URL=turn:your-turn-server.com:3478
# NEXT_PUBLIC_TURN_USERNAME=your-username
# NEXT_PUBLIC_TURN_CREDENTIAL=your-credential
```

### Backend Configuration

Backend configuration (`Backend/config/env.ts`) uses:

- `SOCKET_PORT` (optional) – Port for standalone Socket.io server (defaults to `3001`)
- `NEXT_PUBLIC_APP_URL` – Frontend URL used to build the CORS allowlist for production

---

## 🌐 Deployment

### Deploy to Render (Single Service)

WebMeet is optimized to run as a **single Node web service** on Render:

**Repository:** `https://github.com/Suryanshu-Nabheet/WebMeet`

#### Build & Deploy Settings

- **Root Directory:** _(leave empty – use repo root)_
- **Build Command:**
  ```bash
  npm install && npm run build
  ```
- **Start Command:**
  ```bash
  npm run start
  ```

The `start` script runs `server.ts`, which:

- Serves the Next.js app from `Frontend/`
- Attaches the Socket.io signaling server on the **same** Render `PORT`

#### Recommended Environment Variables on Render

- `NODE_ENV=production`
- `NEXT_PUBLIC_APP_URL=https://<your-WebMeet-domain>.onrender.com`

> **Note:** No `NEXT_PUBLIC_SOCKET_URL` is required in this setup – the client will use the same origin as the page.

---

## 🗺️ Roadmap

- [ ] Persistent rooms and schedules (database support)
- [ ] Authentication and user profiles
- [ ] Recording + playback of sessions
- [ ] Organization-level admin tools (teams, permissions, analytics)
- [ ] Screen sharing capabilities
- [ ] Breakout rooms functionality
- [ ] Mobile app support
- [ ] Enhanced security features

---

## 📄 License

This project is provided as-is for learning and experimentation. If you plan to use it in production at scale, review and adapt the code, security posture, and deployment setup to your organization's requirements.

---

## 📧 Contact

**WebMeet**

- 🌐 GitHub: [WebMeet Repository](https://github.com/Suryanshu-Nabheet/WebMeet)
- 🐛 Issues & Feature Requests: Please open a [GitHub issue](https://github.com/Suryanshu-Nabheet/WebMeet/issues)

---

<div align="center">
  <p>Made with ❤️ by the WebMeet Team</p>
  <p>
    <a href="https://github.com/Suryanshu-Nabheet/WebMeet">⭐ Star us on GitHub</a>
  </p>
</div>
