-- ============================================================
-- TiffinTrack Indexes (Module 6: File Organization & Indexing)
-- database/indexes.sql
-- ============================================================

USE tiffintrack;

-- Fast 'Top vendors in my locality' lookup (most frequent customer query)
CREATE INDEX idx_vendors_locality_rating ON vendors (locality, avg_rating);

-- Fast delivery queries per subscription by date (highest volume query)
CREATE INDEX idx_deliveries_sub_date ON deliveries (subscription_id, date);

-- Fast active subscription check for customers (prevents duplicate subs)
CREATE INDEX idx_subscriptions_customer_status ON subscriptions (customer_id, status);

-- Fast vendor subscriber queries
CREATE INDEX idx_subscriptions_vendor_status ON subscriptions (vendor_id, status);

-- Agent delivery routes by date and status
CREATE INDEX idx_deliveries_agent_date_status ON deliveries (agent_id, date, status);

-- Fast user lookup during authentication
CREATE INDEX idx_users_role_status ON users (role, status);

-- Complaints filtering by vendor and status
CREATE INDEX idx_complaints_vendor_status ON complaints (vendor_id, status);

-- Audit log filtering by timestamp and role
CREATE INDEX idx_audit_created_role ON audit_logs (created_at, user_role);

-- Group membership queries
CREATE INDEX idx_group_residence_loc ON group_subscriptions (residence_name, locality);
