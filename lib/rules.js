// ALL the auction rules live in this one file.
// It is used by the server (to enforce the rules) and by the screens (to show them).

// What a team has bought, spent and still needs.
export function getTeamStats(team, players, categories, startingPurse) {
  const sold = players.filter((p) => p.status === 'sold' && p.team_id === team.id);
  const spent = sold.reduce((sum, p) => sum + (p.sold_price || 0), 0);
  const filled = new Set(sold.map((p) => p.category_id)); // categories already filled
  const missing = categories.filter((c) => !filled.has(c.id)); // categories still empty
  return {
    sold,
    spent,
    purseLeft: startingPurse - spent,
    filled,
    missing,
    slotsFilled: sold.length,
    slotsTotal: categories.length,
  };
}

// The first bid is the base price. After that every click adds one increment.
export function nextBidAmount(category, currentBid) {
  if (currentBid === null || currentBid === undefined) return category.base_price;
  return currentBid + category.increment;
}

// Can this team place the next bid on this player?
// Returns { ok, reason, amount, maxBid, stats }
export function checkTeamCanBid({
  team,
  category,
  categories,
  players,
  startingPurse,
  currentBid,
  leadingTeamId,
}) {
  const stats = getTeamStats(team, players, categories, startingPurse);
  const amount = nextBidAmount(category, currentBid);

  // Rule 1: one player per category.
  if (stats.filled.has(category.id)) {
    return { ok: false, reason: `Has a ${category.name} player`, amount, stats };
  }
  // Rule 2: the highest bidder cannot raise their own bid.
  if (leadingTeamId && leadingTeamId === team.id) {
    return { ok: false, reason: 'Leading', leading: true, amount, stats };
  }
  // Rule 3: keep enough money to buy a player in every OTHER empty category (at base price).
  const reserve = stats.missing
    .filter((c) => c.id !== category.id)
    .reduce((sum, c) => sum + c.base_price, 0);
  const maxBid = stats.purseLeft - reserve;
  if (amount > maxBid) {
    return { ok: false, reason: 'Purse too low', amount, maxBid, stats };
  }
  return { ok: true, amount, maxBid, stats };
}
