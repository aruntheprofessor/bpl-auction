// Works out how many columns give the neatest rows.
// Example: 8 teams with at most 5 per row -> 2 rows -> 4 per row (4 + 4, not 5 + 3).
export function balancedColumns(count, maxPerRow) {
  if (!count || count < 1) return 1;
  const rows = Math.ceil(count / maxPerRow);
  return Math.ceil(count / rows);
}
