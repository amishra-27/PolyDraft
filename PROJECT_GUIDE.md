# PolyDraft - Project Guide

**Fantasy Sports-Style Gamified Prediction Markets on Base**

---

## Quick Overview

PolyDraft is a Next.js 16 app that gamifies prediction markets with fantasy draft mechanics. Currently building the draft room, league management, and Polymarket API integration.

**Current Status**: MVP in progress with working UI, API integration, and dev mode for testing.

---

## Table of Contents
1. [Current State](#current-state)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Development Setup](#development-setup)
5. [Core Features](#core-features)
6. [Design System](#design-system)

---

## Current State

### What's Working
- ✅ Next.js 16 app with mobile-first UI (448px max-width)
- ✅ Draft room page with market selection
- ✅ League browsing with cards
- ✅ Profile page with stats
- ✅ Polymarket API integration (lib/api/polymarket.ts)
- ✅ Dev mode with sidebar for testing (components/DevSidebar.tsx)
- ✅ Dark theme with coral/red accents
- ✅ Bottom navigation bar

### In Progress
- 🔨 Polymarket market data fetching
- 🔨 Wallet integration (OnchainKit setup)
- 🔨 League creation flow
- 🔨 Draft logic and state management

### Not Started
- ❌ Smart contracts
- ❌ Base blockchain integration
- ❌ MiniKit SDK implementation
- ❌ NFT rewards


---

## Tech Stack

### Frontend
- **Next.js 16.0.6** - React framework with App Router (Turbopack)
- **React 19.2.0** - Latest React
- **TypeScript 5.x** - Type safety
- **Tailwind CSS 3.4.1** - Styling
- **Lucide React 0.555.0** - Icons

### Blockchain (Installed, Not Yet Integrated)
- **OnchainKit 1.1.2** - Base/Coinbase components
- **Wagmi 2.19.5** - React hooks for Ethereum
- **Viem 2.41.2** - TypeScript Ethereum library
- **TanStack Query 5.90.11** - Data fetching

### MiniApp (Installed, Not Yet Integrated)
- **Farcaster MiniApp SDK 0.2.1**
- **Farcaster Quick Auth 0.0.8**

### APIs
- **Polymarket API** - Market data (in progress)


---

## Project Structure

```
PolyDraft/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home - leagues overview
│   ├── draft/page.tsx           # Draft room
│   ├── leagues/
│   │   ├── page.tsx             # League browser
│   │   └── [id]/page.tsx        # League details
│   ├── leaderboard/page.tsx     # Leaderboard
│   ├── profile/page.tsx         # User profile
│   ├── rewards/page.tsx         # Rewards
│   └── api/polymarket/route.ts  # Polymarket API proxy
│
├── components/                   # UI components
│   ├── ConnectWallet.tsx
│   ├── DraftSlots.tsx
│   ├── LeaderboardRow.tsx
│   ├── LeagueCard.tsx
│   ├── MarketCard.tsx
│   ├── Navbar.tsx               # Bottom nav
│   ├── DevSidebar.tsx           # Dev mode controls
│   ├── ModeToggle.tsx
│   └── ui/                      # Base components
│       ├── Button.tsx
│       └── Skeleton.tsx
│
├── lib/
│   ├── api/
│   │   ├── polymarket.ts        # Polymarket API client
│   │   └── types.ts             # API types
│   ├── contexts/
│   │   └── DevSettingsContext.tsx # Dev mode state
│   ├── hooks/
│   │   └── usePolymarket.ts     # Polymarket hook
│   └── data/
│       └── dummyData.ts         # Mock data
│
├── .env.example                  # Environment template
├── tailwind.config.ts
└── package.json
```

---

## Core Features

### Pages
- **Home (/)** - League overview with cards
- **Draft (/draft)** - Draft room with market selection
- **Leagues (/leagues)** - Browse leagues, individual league pages
- **Leaderboard (/leaderboard)** - Rankings (placeholder)
- **Rewards (/rewards)** - Achievements (placeholder)
- **Profile (/profile)** - User stats with grid layout

### Components
- **Bottom Navigation** - 5-tab bar (Home, Leagues, News, Analytics, Profile)
- **League Cards** - Entry fee, members, prize pool, status badges
- **Draft Slots** - Visual 10-slot draft board with pick indicator
- **Market Cards** - Prediction markets with YES/NO options
- **Dev Sidebar** - Toggle dummy/real data, theme controls

### Dev Mode
- Press "M" key to toggle dev sidebar
- Switch between dummy data and Polymarket API
- Testing controls for development

---

## Development Setup

### Quick Start

```bash
# Install dependencies
npm install

# Set up environment (optional)
cp .env.example .env

# Run dev server
npm run dev
# Open http://localhost:3000
```

### Environment Variables

```env
# Polymarket API (optional - falls back to dummy data)
POLYMARKET_API_KEY=your_api_key

# For future blockchain integration
NEXT_PUBLIC_ONCHAINKIT_API_KEY=
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=
```

### Dev Commands

- `npm run dev` - Start dev server (Turbopack)
- `npm run build` - Production build
- `npm run start` - Run production build
- `npm run lint` - ESLint check


---

## Design System

### Layout
- **Mobile-first**: max-width 448px (28rem)
- **Portrait orientation** optimized
- **Bottom navigation** for one-handed use
- **4px spacing base** for mobile

### Colors
```
Background: #1a1b26  (dark slate)
Surface:    #242530  (lighter slate for cards)
Primary:    #ff6b9d  (coral for CTAs)
Success:    #10b981  (green)
Text:       #ffffff  (white)
Text Muted: #a1a1aa  (gray)
```

### Typography
- System fonts (Arial, Helvetica, sans-serif)
- Headings: 18-24px bold
- Body: 14px regular
- Small: 10-12px for metadata

### Components
- **Cards**: Surface bg, 12px rounded, subtle border, glow on hover
- **Buttons**: Primary (coral) or secondary (surface), 44px min height
- **Status badges**: Color-coded (green/coral/blue/gray)
- **Touch targets**: All ≥44px for mobile
- **Navigation**: Fixed bottom bar, 5 tabs with icons + labels

---

**Last Updated**: December 3, 2024
**Status**: MVP Development
