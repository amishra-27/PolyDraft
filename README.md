# Polydraft Product Design Specification

Polydraft is a fantasy league platform for prediction markets built on **Base**. It serves as a social UI and scoring layer on top of **Polymarket**, gamifying the experience by allowing users to compete in leagues by drafting outcome sides of markets.

**Polydraft never holds user funds; all liquidity and real trading remain on Polymarket.**

## Quick Links
- [Project Guide](./PROJECT_GUIDE.md) - Development guide and current status
- [Polymarket API Docs](./docs/POLYMARKET_API.md) - API integration reference
- [CLOB WebSocket](./docs/CLOB_WEBSOCKET.md) - Real-time price updates
- [RTDS WebSocket](./docs/RTDS_WEBSOCKET.md) - Market updates and crypto prices

---

## 1. Product Overview & Modes

Polydraft operates in two distinct modes:

| Feature | Mode A: Social Fantasy (Default) | Mode B: Live Builder Mode (Restricted) |
| :--- | :--- | :--- |
| **Trading** | Virtual points only. No real trades executed. | Each pick is executed as a real order on Polymarket. |
| **Scoring** | Purely point-based (**+1 for correct outcome**). | Point-based league scoring + normal **Polymarket PnL** on user's wallet. |
| **User Funds** | N/A | Funds held in user's wallet, traded gaslessly via Builder SDK. |
| **Compliance** | US-safe. Positions tracked for reputation only. | Requires eligible jurisdiction (Geo-gated). |

> **v1 Focus:** Daily Quick Leagues (e.g., 3 rounds, 2–6 players, synchronous draft).

---

## 2. Core User Flows

### 2.1 League Creation (Commissioner)

* **Action:** User connects wallet (Base) and sets up a league (recorded in Supabase with minimal on-chain record).
* **Default v1 Settings:** Duration (1 day), Max Players (2–6), Rounds (e.g., 3).
* **Config:** Name, Max Players, Mode (Social/Live), Optional Entry requirement (Free vs. Token-Gated).
* **On-Chain Record:** Minimal record in `LeagueRegistry.sol`.

### 2.2 Daily Quick Snake Draft

* **Timing Model:** Short, synchronous draft (e.g., **30–45 seconds per pick**). Auto-pick on timeout.
* **Market Slate:** Small, fixed number of markets (e.g., 3) pulled from Polymarket (Gamma API) filtered by: active status, relevance (e.g., today's date), and minimum liquidity.
* **Action:** Player selects a **Market** and an **Outcome Side (YES/NO)**.
* **Constraint:** Once a specific Market/Side is drafted, it is locked for the league.

### 2.3 Live Action Toggle (Builder Integration)

* **Live Builder Mode ON (Eligible Users):**
    * App constructs a simple, fixed-size Polymarket order.
    * Order is submitted **gaslessly** via **Polymarket Builder SDK + Polygon relayer**.
    * Order is tagged with Polydraft's Builder ID for attribution.
* **Geo-Blocking:** For US/restricted users, the Live Mode toggle is disabled.

### 2.4 In-League Swaps (Swap-But-Not-Exit)

* **Purpose:** Allows users to update beliefs (e.g., YES → NO) while keeping league scoring focused on final resolution.
* **Mechanic:** Player can flip their drafted side (limited attempts, e.g., **max 1 swap/pick** for v1).
    * **Live Mode:** Backend sells current side and buys the opposite side on Polymarket.
* **Scoring:** League points track the **final side** held at resolution.

### 2.5 Scoring & Settlement

* **Trigger:** Polymarket oracle resolution.
* **Logic:** **+1 point** if the player's final side matches the resolved outcome; 0 points otherwise.
* **Settlement:** Backend calls **`commitWinner(leagueId, winnerAddress)`** on the Base smart contract.
* **Reward:** Winner calls **`mintTrophy(leagueId)`** on `LeagueRegistry.sol` to receive an **ERC-721 Season Winner NFT** on Base.
    * *Real trading benefits:* Live Builder players also realize normal Polymarket PnL.

---

## 3. Technical Architecture

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Blockchain** | **Base** | On-chain reputation: League IDs, winners, Trophy NFTs. **No funds custody.** |
| **Backend** | **Supabase** | Off-chain data (league state, player picks), **WebSockets** for draft sync. |
| **Data Source** | **Polymarket Gamma API** | Market discovery, odds, and resolution status. |
| **Execution** | **Polymarket Builder SDK** | Order signing, **gasless** transaction relaying (Polygon). |
| **Frontend** | **Next.js + OnchainKit** | Wallet connection and primary UX. |

### Smart Contract (`LeagueRegistry.sol` on Base)

* **Purpose:** Minimal registry for league reputation and verifying winners. Avoids holding user funds.
* **Data:** `struct League`, `mapping(uint256 => address) public leagueWinners`.
* **Functions:**
    * `createLeague(string calldata name, uint256 endTime)`
    * `commitWinner(uint256 leagueId, address winner)` (Called by authorized backend)
    * `mintTrophy(uint256 leagueId)` (Called by winner to claim ERC-721 NFT)

---

## 4. API Integration Specification

### 4.1 Market Fetcher (Polymarket Gamma API)

* **Endpoint:** `GET /events`
* **Strategy (v1):** Filter by `active=true`, `closed=false`, `order=volume`. Additional backend filtering for date relevance and min liquidity to select the "daily slate" (e.g., ≤3 markets).
* **Resolution:** Periodically query market status to determine league outcomes.

### 4.2 Builder Execution (Live Mode)

* **Library:** `@polymarket/builder-signing-sdk`
* **Process:** User signs order data on frontend → Backend wraps signature with Builder headers → Sends to gasless relayer on Polygon → Polydraft Builder ID is used for attribution.

---

## 5. Roadmap & Extensions

| Scope | Key Deliverables |
| :--- | :--- |
| **Hackathon (Short Term)** | Working Draft UI (WebSocket sync). Simple Market Slate. Scoring and settlement. **Basic Live Mode execution.** **ERC-721 Trophy NFT minting on Base.** |
| **Medium Term** | Token-Gated Leagues. Cross-Chain / Social Reputation (e.g., Farcaster). Enhanced Odds-Weighted Scoring. Refined In-League Swaps. |
| **Long Term** | Reward Overlays funded by Builder rewards. Automated Live Mode strategies. Decentralized Oracle support for non-Polymarket events. |

---

## Development

See [PROJECT_GUIDE.md](./PROJECT_GUIDE.md) for development setup and current implementation status.

```bash
npm install
npm run dev
```

---

**Last Updated:** December 3, 2024
**Status:** MVP Development
