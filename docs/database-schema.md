# TiffinTrack Database Schema Reference

## Core Relational Tables (COD & 3-Role Architecture)

1. **`users`**: Authentication credentials and role registry (`student`, `vendor`, `admin`).
2. **`customers`**: Student profiles, room/hostel residence details, and `wallet_balance` (repurposed for next-payment tracking).
3. **`vendors`**: Verified kitchen registry, locality, cuisine type, contact info, and composite ratings.
4. **`meal_plans`**: Pricing, meals included, and dietary categorization. Editable by vendors with ownership verification.
5. **`subscriptions`**: Student subscription records with dual approval tracking (`pending`, `active`, `cancelled`, `rejected`), `approved_by` (`vendor`/`admin`), and price-locked attributes (`locked_price`, `locked_meals_included`).
6. **`payments`**: COD billing and collection ledger (`amount_due`, `status`: `pending_cash`, `collected`).
7. **`deliveries`**: Daily order fulfillment records (`pending`, `out_for_delivery`, `delivered`, `skipped`).
8. **`skip_requests`**: Meal skip logs with dynamic per-meal refund adjustments applied directly to `payments.amount_due`.
9. **`group_subscriptions`**: Add-on 3 roommate order pooling with 10% group discounts (minimum 3 members).
10. **`ratings`**: Multi-criteria weighted student feedback (Taste, Hygiene, Punctuality, Value).
11. **`complaints`**: Ticket lifecycle management with admin and vendor resolution workflows.
12. **`audit_logs`**: Immutable security audit trail recording all critical mutations.
