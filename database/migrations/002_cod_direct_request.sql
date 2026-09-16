-- Migration 002: Cash-on-Delivery (COD) & Direct Request Model
ALTER TABLE subscriptions 
  MODIFY COLUMN status ENUM('pending', 'active', 'cancelled', 'expired', 'paused', 'rejected') NOT NULL DEFAULT 'pending';

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS approved_by VARCHAR(50) NULL DEFAULT NULL;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS approved_at DATETIME NULL DEFAULT NULL;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS mode VARCHAR(50) NOT NULL DEFAULT 'cash_on_delivery';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS locked_price DECIMAL(10,2) NULL DEFAULT NULL;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS locked_meals_included INT NULL DEFAULT NULL;

UPDATE subscriptions s
JOIN meal_plans p ON s.plan_id = p.plan_id
SET s.locked_price = p.price,
    s.locked_meals_included = p.meals_included
WHERE s.locked_price IS NULL;

ALTER TABLE payments ADD COLUMN IF NOT EXISTS amount_due DECIMAL(10,2) NULL DEFAULT NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS collected_at DATETIME NULL DEFAULT NULL;
ALTER TABLE payments MODIFY COLUMN mode VARCHAR(50) NOT NULL DEFAULT 'cash_on_delivery';
ALTER TABLE payments MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'pending_cash';

UPDATE payments SET amount_due = amount WHERE amount_due IS NULL;

CREATE INDEX IF NOT EXISTS idx_subs_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subs_vendor_status ON subscriptions(vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_pay_status ON payments(status);
