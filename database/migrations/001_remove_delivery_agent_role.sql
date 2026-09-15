-- ============================================================
-- Migration: 001_remove_delivery_agent_role.sql
-- Description: Transition from 4-role to 3-role (Student, Vendor, Admin)
-- Preserves delivery_agents table in schema for academic report consistency
-- ============================================================

-- 1. Ensure agent_id in deliveries is NULLABLE
ALTER TABLE deliveries MODIFY COLUMN agent_id VARCHAR(32) NULL;

-- 2. Expand ENUM to allow transition
ALTER TABLE deliveries MODIFY COLUMN status ENUM('prepared', 'dispatched', 'delivered', 'skipped', 'cancelled', 'pending', 'out_for_delivery', 'failed') NOT NULL DEFAULT 'prepared';

-- 3. Re-map delivery status values to vendor-driven set
UPDATE deliveries SET status = 'prepared' WHERE status = 'pending';
UPDATE deliveries SET status = 'dispatched' WHERE status = 'out_for_delivery';
UPDATE deliveries SET status = 'cancelled' WHERE status = 'failed';

-- 4. Finalize 3-role status ENUM
ALTER TABLE deliveries MODIFY COLUMN status ENUM('prepared', 'dispatched', 'delivered', 'skipped', 'cancelled') NOT NULL DEFAULT 'prepared';
