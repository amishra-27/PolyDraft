import type { LeagueMember, Pick } from './types';

/**
 * Calculate whose turn it is based on snake draft order
 * Snake draft: Round 1 goes 1->2->3, Round 2 goes 3->2->1, etc.
 */
export function calculateCurrentTurn(
  pickNumber: number,
  members: LeagueMember[]
): LeagueMember | null {
  if (members.length === 0) return null;

  const totalPlayers = members.length;
  const round = Math.floor(pickNumber / totalPlayers);
  const positionInRound = pickNumber % totalPlayers;

  // Snake draft: even rounds go forward, odd rounds go backward
  const isForwardRound = round % 2 === 0;
  const playerIndex = isForwardRound
    ? positionInRound
    : totalPlayers - 1 - positionInRound;

  return members[playerIndex] || null;
}

/**
 * Get the current round number (1-indexed)
 */
export function getCurrentRound(pickNumber: number, totalPlayers: number): number {
  return Math.floor(pickNumber / totalPlayers) + 1;
}

/**
 * Check if a specific market + outcome side combination is already taken
 */
export function isMarketSideTaken(
  picks: Pick[],
  marketId: string,
  outcomeSide: 'YES' | 'NO'
): boolean {
  return picks.some(
    (pick) => pick.market_id === marketId && pick.outcome_side === outcomeSide
  );
}

/**
 * Get all picks for a specific user in a league
 */
export function getUserPicks(picks: Pick[], walletAddress: string): Pick[] {
  return picks.filter((pick) => pick.wallet_address === walletAddress);
}

/**
 * Calculate the total number of rounds based on total picks and players
 */
export function getTotalRounds(totalPicks: number, totalPlayers: number): number {
  return Math.ceil(totalPicks / totalPlayers);
}

/**
 * Check if the draft is complete
 */
export function isDraftComplete(
  currentPickNumber: number,
  totalPlayers: number,
  roundsPerDraft: number
): boolean {
  const totalPicksNeeded = totalPlayers * roundsPerDraft;
  return currentPickNumber >= totalPicksNeeded;
}

/**
 * Get the next pick deadline based on pick timer duration
 */
export function getPickDeadline(pickTimerSeconds: number = 45): Date {
  return new Date(Date.now() + pickTimerSeconds * 1000);
}

/**
 * Format a wallet address for display (0x1234...5678)
 */
export function formatWalletAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Sort members by their draft order
 */
export function sortMembersByDraftOrder(members: LeagueMember[]): LeagueMember[] {
  return [...members].sort((a, b) => {
    if (a.draft_order === null) return 1;
    if (b.draft_order === null) return -1;
    return a.draft_order - b.draft_order;
  });
}
