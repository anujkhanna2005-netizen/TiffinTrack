# TiffinTrack Database Schema Reference

## Core Relational Tables (COD & 3-Role Architecture)

1. **`users`**: Authentication credentials and role registry (`customer`/`student`, `vendor`, `admin`).
2. **`customers`**: Student profiles, room/hostel residence details, default profile-level preferences (`bread_preference`, `spice_level`, `special_instructions` [max 200 chars]).
3. **`vendors`**: Verified kitchen registry, locality, cuisine type, contact info, and composite ratings.
4. **`meal_plans`**: Pricing, meals included, and dietary categorization. Editable by vendors with ownership verification.
5. **`subscriptions`**: Student subscription records with dual approval tracking (`pending`, `active`, `cancelled`, `rejected`), `approved_by` (`vendor`/`admin`), price-locked attributes (`locked_price`, `locked_meals_included`), active delivery preferences (`bread_preference`, `spice_level`, `special_instructions`), and optional `group_id`.
   - **Preference Snapshot Architecture**: `customers.*` stores default profile preferences. At subscription creation, defaults are snapshotted into `subscriptions.*`. `PUT /api/subscription/preferences` updates the active subscription's live preferences (which vendor kitchens inspect on dispatch) and updates profile defaults.
   - **Price Invariant**: `locked_price` is strictly immutable to external discount or vendor price changes. Group discounts and meal skips modify `payments.amount_due` only.
6. **`payments`**: COD billing and collection ledger (`amount_due`, `status`: `pending_cash`, `collected`).
7. **`deliveries`**: Daily order fulfillment records (`prepared`, `dispatched`, `delivered`, `skipped`), dynamically rendering student add-ons (Extra Roti, Spice Level, Special Instructions) and published daily menu items.
8. **`skip_requests`**: Meal skip logs with dynamic per-meal refund adjustments applied directly to `payments.amount_due`.
9. **`group_subscriptions`**: Roommate order pooling with centralized tiered discounts:
   - **3-4 members**: 5.0% discount applied to `payments.amount_due`
   - **5+ members**: 10.0% discount applied to `payments.amount_due`
   - `< 3 members`: 0.0% discount (threshold not met)
10. **`menu_votes`**: Community menu voting records (`vote_id`, `customer_id`, `vendor_id`, `menu_id`, `item_name`, `vote_date`), allowing vendors to view real-time dish tallies and add winning student dishes to daily menus.
11. **`ratings`**: Multi-criteria weighted student feedback (Taste 35%, Hygiene 25%, Punctuality 20%, Value 20%).
12. **`complaints`**: Ticket lifecycle management with admin and vendor resolution workflows.
13. **`audit_logs`**: Immutable security audit trail recording all critical mutations (preferences, votes, group discounts, approvals).
