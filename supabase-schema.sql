-- PolyDraft Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/wlgjwaihjbrtblvoqxgz/sql/new

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE,
  fid BIGINT UNIQUE, -- Farcaster ID
  username TEXT,
  display_name TEXT, -- Farcaster display name
  auth_method TEXT DEFAULT 'farcaster', -- 'farcaster', 'wallet'
  wins INT DEFAULT 0,
  total_leagues INT DEFAULT 0,
  total_points INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Leagues table
CREATE TABLE leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  on_chain_id BIGINT UNIQUE, -- from smart contract
  name TEXT NOT NULL,
  creator_address TEXT NOT NULL,
  max_players INT DEFAULT 6,
  status TEXT DEFAULT 'open', -- open, drafting, active, ended
  mode TEXT DEFAULT 'social', -- social, live
  draft_started_at TIMESTAMP,
  end_time TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- League members
CREATE TABLE league_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  wallet_address TEXT NOT NULL,
  joined_at TIMESTAMP DEFAULT NOW(),
  draft_order INT, -- assigned when draft starts (1, 2, 3...)
  UNIQUE(league_id, wallet_address)
);

-- Picks table
CREATE TABLE picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  wallet_address TEXT NOT NULL,
  market_id TEXT NOT NULL, -- Polymarket market ID
  outcome_side TEXT NOT NULL, -- 'YES' or 'NO'
  round INT NOT NULL,
  pick_number INT NOT NULL, -- overall pick number in draft
  picked_at TIMESTAMP DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE,
  correct BOOLEAN, -- set when market resolves
  UNIQUE(league_id, market_id, outcome_side) -- Lock market+side combo
);

-- Scores table
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  wallet_address TEXT NOT NULL,
  points INT DEFAULT 0,
  rank INT,
  is_winner BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(league_id, wallet_address)
);

-- Indexes for performance
CREATE INDEX idx_leagues_status ON leagues(status);
CREATE INDEX idx_picks_league ON picks(league_id);
CREATE INDEX idx_picks_user ON picks(user_id);
CREATE INDEX idx_scores_league ON scores(league_id);
CREATE INDEX idx_league_members_league ON league_members(league_id);

-- Enable Realtime for draft room
ALTER PUBLICATION supabase_realtime ADD TABLE picks;
ALTER PUBLICATION supabase_realtime ADD TABLE league_members;
ALTER PUBLICATION supabase_realtime ADD TABLE leagues;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Policies (for MVP, allow all reads, authenticated writes)
CREATE POLICY "Anyone can read leagues" ON leagues FOR SELECT USING (true);
CREATE POLICY "Anyone can read picks" ON picks FOR SELECT USING (true);
CREATE POLICY "Anyone can read scores" ON scores FOR SELECT USING (true);
CREATE POLICY "Anyone can read members" ON league_members FOR SELECT USING (true);
CREATE POLICY "Anyone can read users" ON users FOR SELECT USING (true);

-- For MVP hackathon, allow inserts/updates (in production, tighten this)
CREATE POLICY "Anyone can insert leagues" ON leagues FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update leagues" ON leagues FOR UPDATE USING (true);
CREATE POLICY "Anyone can insert picks" ON picks FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update picks" ON picks FOR UPDATE USING (true);
CREATE POLICY "Anyone can insert members" ON league_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update users" ON users FOR UPDATE USING (true);
CREATE POLICY "Anyone can insert scores" ON scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update scores" ON scores FOR UPDATE USING (true);
