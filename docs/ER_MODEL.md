# TiffinTrack — Entity-Relationship (ER) Model Documentation

## Decision Checkpoint: Direct Request & Cash-on-Delivery (COD) Model

> **Explicit Academic Design Decision (Section 0 Master Plan Note):**  
> "Simplified from a simulated digital wallet to a cash-on-delivery model reflecting real campus tiffin practices; the `Customer.wallet_balance` attribute is repurposed as an amount_due/next_payment tracking field rather than a prepaid balance."

---

## Repurposed Relational Entities

### 1. Payment Table (`payments`)
Repurposed from a simulated instant wallet deduction table into a COD billing ledger that tracks amount owed and settlement status.
- `payment_id` (PK) VARCHAR(32)
- `customer_id` (FK -> `customers`)
- `subscription_id` (FK -> `subscriptions`)
- `amount` DECIMAL(10,2) — Total plan cost
- `amount_due` DECIMAL(10,2) — Remaining balance owed after skip credits / discounts
- `mode` ENUM('cash_on_delivery', 'direct_upi', 'wallet') — *'wallet' is retained solely for historical records; all new entries use 'cash_on_delivery' or 'direct_upi'*
- `status` ENUM('pending_cash', 'collected', 'adjusted', 'success', 'refunded', 'failed')
- `date` TIMESTAMP
- `collected_at` TIMESTAMP NULL

### 2. Subscription Table (`subscriptions`)
Extended to support pending student requests, dual vendor/admin approvals, and price-lock guarantees.
- `sub_id` (PK) VARCHAR(32)
- `customer_id` (FK -> `customers`)
- `plan_id` (FK -> `meal_plans`)
- `vendor_id` (FK -> `vendors`)
- `start_date`, `end_date` DATE
- `status` ENUM('pending', 'active', 'cancelled', 'expired', 'paused', 'rejected')
- `approved_by` ENUM('vendor', 'admin') NULL
- `approved_at` TIMESTAMP NULL
- `mode` ENUM('cash_on_delivery', 'direct_upi')
- `locked_price` DECIMAL(10,2) — Locked at creation time so future vendor price edits do not retroactively alter existing active subscriptions
- `locked_meals_included` INT
