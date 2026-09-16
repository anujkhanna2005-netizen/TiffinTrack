// ============================================================
// TiffinTrack - Centralized Group Discount Tiers
// server/utils/discounts.js
// ============================================================

/**
 * Calculates the eligible discount percentage based on group member count.
 * Invariant Rules:
 * - Tier 1: 3-4 members -> 5.0% discount
 * - Tier 2: 5+ members  -> 10.0% discount
 * - < 3 members         -> 0.0% discount
 * 
 * INVARIANT: Group discounts reduce payments.amount_due on active bills.
 * Group discounts MUST NEVER overwrite subscriptions.locked_price.
 * 
 * @param {number} memberCount 
 * @returns {number} discount percentage (e.g. 0.0, 5.0, or 10.0)
 */
function getGroupDiscountPercent(memberCount) {
  const count = parseInt(memberCount, 10) || 0;
  if (count >= 5) return 10.0;
  if (count >= 3) return 5.0;
  return 0.0;
}

module.exports = {
  getGroupDiscountPercent
};
