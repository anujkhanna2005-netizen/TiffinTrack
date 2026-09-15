-- ============================================================
-- TiffinTrack Relational Database Schema (DDL)
-- Database: tiffintrack
-- Covers all 17 entities for 2nd Year CSE-CPS DBMS Project
-- ============================================================

CREATE DATABASE IF NOT EXISTS tiffintrack;
USE tiffintrack;

-- 1. Central Authentication & Account Table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('customer', 'vendor', 'delivery_agent', 'admin') NOT NULL,
    status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Database-Backed Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_used_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Customers (Students in PG / Flat)
CREATE TABLE IF NOT EXISTS customers (
    customer_id VARCHAR(32) PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    pg_or_flat_name VARCHAR(100) NOT NULL,
    locality VARCHAR(100) NOT NULL,
    room_no VARCHAR(20) NOT NULL,
    dietary_pref VARCHAR(50) NOT NULL DEFAULT 'veg',
    wallet_balance DECIMAL(10,2) NOT NULL DEFAULT 1000.00,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_customers_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Vendors (Tiffin Kitchens)
CREATE TABLE IF NOT EXISTS vendors (
    vendor_id VARCHAR(32) PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    kitchen_address VARCHAR(255) NOT NULL,
    locality VARCHAR(100) NOT NULL,
    license_no VARCHAR(50) NOT NULL,
    contact VARCHAR(20) NOT NULL,
    cuisine_type VARCHAR(100) NOT NULL,
    avg_rating DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vendors_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Delivery Agents
CREATE TABLE IF NOT EXISTS delivery_agents (
    agent_id VARCHAR(32) PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    assigned_locality VARCHAR(100) NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL DEFAULT 'bike',
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_agents_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Meal Plans
CREATE TABLE IF NOT EXISTS meal_plans (
    plan_id VARCHAR(32) PRIMARY KEY,
    vendor_id VARCHAR(32) NOT NULL,
    name VARCHAR(100) NOT NULL,
    plan_type ENUM('daily', 'weekly', 'monthly') NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    meals_included INT NOT NULL,
    veg_or_nonveg ENUM('veg', 'nonveg', 'both') NOT NULL,
    description TEXT NULL,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_plans_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    sub_id VARCHAR(32) PRIMARY KEY,
    customer_id VARCHAR(32) NOT NULL,
    plan_id VARCHAR(32) NOT NULL,
    vendor_id VARCHAR(32) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('active', 'cancelled', 'expired', 'paused') NOT NULL DEFAULT 'active',
    auto_renew BOOLEAN NOT NULL DEFAULT FALSE,
    switched_from_sub_id VARCHAR(32) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_subs_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE RESTRICT,
    CONSTRAINT fk_subs_plan FOREIGN KEY (plan_id) REFERENCES meal_plans(plan_id) ON DELETE RESTRICT,
    CONSTRAINT fk_subs_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE RESTRICT,
    CONSTRAINT fk_subs_switched FOREIGN KEY (switched_from_sub_id) REFERENCES subscriptions(sub_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Daily Menus
CREATE TABLE IF NOT EXISTS daily_menus (
    menu_id VARCHAR(32) PRIMARY KEY,
    vendor_id VARCHAR(32) NOT NULL,
    date DATE NOT NULL,
    meal_type ENUM('lunch', 'dinner', 'both') NOT NULL,
    items JSON NOT NULL,
    published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_menus_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Deliveries (Weak Entity depending on Subscription + Date)
CREATE TABLE IF NOT EXISTS deliveries (
    delivery_id VARCHAR(32) PRIMARY KEY,
    subscription_id VARCHAR(32) NOT NULL,
    agent_id VARCHAR(32) NOT NULL,
    date DATE NOT NULL,
    meal_type ENUM('lunch', 'dinner') NOT NULL,
    status ENUM('pending', 'out_for_delivery', 'delivered', 'failed', 'skipped') NOT NULL DEFAULT 'pending',
    delivered_time DATETIME NULL,
    notes VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_deliv_sub FOREIGN KEY (subscription_id) REFERENCES subscriptions(sub_id) ON DELETE RESTRICT,
    CONSTRAINT fk_deliv_agent FOREIGN KEY (agent_id) REFERENCES delivery_agents(agent_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Payments
CREATE TABLE IF NOT EXISTS payments (
    payment_id VARCHAR(32) PRIMARY KEY,
    customer_id VARCHAR(32) NOT NULL,
    subscription_id VARCHAR(32) NULL,
    amount DECIMAL(10,2) NOT NULL,
    date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    mode ENUM('wallet', 'upi', 'cash_on_delivery', 'netbanking') NOT NULL DEFAULT 'wallet',
    status ENUM('success', 'refunded', 'failed') NOT NULL DEFAULT 'success',
    CONSTRAINT fk_pay_cust FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE RESTRICT,
    CONSTRAINT fk_pay_sub FOREIGN KEY (subscription_id) REFERENCES subscriptions(sub_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Skip Requests (Add-on 3: Vacation Mode)
CREATE TABLE IF NOT EXISTS skip_requests (
    skip_id VARCHAR(32) PRIMARY KEY,
    subscription_id VARCHAR(32) NOT NULL,
    customer_id VARCHAR(32) NOT NULL,
    date DATE NOT NULL,
    reason VARCHAR(255) NOT NULL,
    refund_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    refund_credited BOOLEAN NOT NULL DEFAULT FALSE,
    applied_to_next_bill BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_skip_sub FOREIGN KEY (subscription_id) REFERENCES subscriptions(sub_id) ON DELETE RESTRICT,
    CONSTRAINT fk_skip_cust FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Complaints
CREATE TABLE IF NOT EXISTS complaints (
    complaint_id VARCHAR(32) PRIMARY KEY,
    customer_id VARCHAR(32) NOT NULL,
    delivery_id VARCHAR(32) NULL,
    vendor_id VARCHAR(32) NOT NULL,
    issue_type ENUM('late_delivery', 'food_quality', 'wrong_items', 'packaging_issue', 'behavior', 'other') NOT NULL,
    description TEXT NOT NULL,
    status ENUM('open', 'in_review', 'resolved', 'rejected') NOT NULL DEFAULT 'open',
    resolution_notes TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_date DATETIME NULL,
    CONSTRAINT fk_comp_cust FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE RESTRICT,
    CONSTRAINT fk_comp_deliv FOREIGN KEY (delivery_id) REFERENCES deliveries(delivery_id) ON DELETE SET NULL,
    CONSTRAINT fk_comp_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Ratings (Add-on 1: Multi-Criteria Rating System)
CREATE TABLE IF NOT EXISTS ratings (
    rating_id VARCHAR(32) PRIMARY KEY,
    customer_id VARCHAR(32) NOT NULL,
    vendor_id VARCHAR(32) NOT NULL,
    subscription_id VARCHAR(32) NOT NULL,
    delivery_id VARCHAR(32) NULL,
    taste_score TINYINT NOT NULL CHECK (taste_score BETWEEN 1 AND 5),
    hygiene_score TINYINT NOT NULL CHECK (hygiene_score BETWEEN 1 AND 5),
    punctuality_score TINYINT NOT NULL CHECK (punctuality_score BETWEEN 1 AND 5),
    value_score TINYINT NOT NULL CHECK (value_score BETWEEN 1 AND 5),
    weighted_score DECIMAL(3,2) NOT NULL,
    review_text TEXT NULL,
    status ENUM('active', 'hidden') NOT NULL DEFAULT 'active',
    date DATE NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rate_cust FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE RESTRICT,
    CONSTRAINT fk_rate_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE RESTRICT,
    CONSTRAINT fk_rate_sub FOREIGN KEY (subscription_id) REFERENCES subscriptions(sub_id) ON DELETE RESTRICT,
    CONSTRAINT fk_rate_deliv FOREIGN KEY (delivery_id) REFERENCES deliveries(delivery_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Vendor Switch Logs (Add-on 2: Smart Vendor Switching)
CREATE TABLE IF NOT EXISTS vendor_switch_logs (
    switch_id VARCHAR(32) PRIMARY KEY,
    customer_id VARCHAR(32) NOT NULL,
    old_vendor_id VARCHAR(32) NOT NULL,
    new_vendor_id VARCHAR(32) NOT NULL,
    old_sub_id VARCHAR(32) NOT NULL,
    new_sub_id VARCHAR(32) NOT NULL,
    switch_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reason VARCHAR(255) NULL,
    CONSTRAINT fk_switch_cust FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE RESTRICT,
    CONSTRAINT fk_switch_oldv FOREIGN KEY (old_vendor_id) REFERENCES vendors(vendor_id) ON DELETE RESTRICT,
    CONSTRAINT fk_switch_newv FOREIGN KEY (new_vendor_id) REFERENCES vendors(vendor_id) ON DELETE RESTRICT,
    CONSTRAINT fk_switch_olds FOREIGN KEY (old_sub_id) REFERENCES subscriptions(sub_id) ON DELETE RESTRICT,
    CONSTRAINT fk_switch_news FOREIGN KEY (new_sub_id) REFERENCES subscriptions(sub_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Menu Votes (Add-on 5: Menu Voting)
CREATE TABLE IF NOT EXISTS menu_votes (
    vote_id VARCHAR(32) PRIMARY KEY,
    customer_id VARCHAR(32) NOT NULL,
    menu_id VARCHAR(32) NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    vote_date DATE NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_customer_menu_vote (customer_id, menu_id, vote_date),
    CONSTRAINT fk_vote_cust FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE RESTRICT,
    CONSTRAINT fk_vote_menu FOREIGN KEY (menu_id) REFERENCES daily_menus(menu_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Group Subscriptions (Add-on 6: Group Subscription Discount)
CREATE TABLE IF NOT EXISTS group_subscriptions (
    group_id VARCHAR(32) PRIMARY KEY,
    residence_name VARCHAR(100) NOT NULL,
    locality VARCHAR(100) NOT NULL,
    vendor_id VARCHAR(32) NOT NULL,
    member_count INT NOT NULL DEFAULT 1,
    discount_applied BOOLEAN NOT NULL DEFAULT FALSE,
    discount_percent DECIMAL(4,2) NOT NULL DEFAULT 0.00,
    formed_date DATE NOT NULL,
    last_updated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_group_residence_vendor (residence_name, locality, vendor_id),
    CONSTRAINT fk_group_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Audit Logs (System-Wide Mutation Audit Trail)
CREATE TABLE IF NOT EXISTS audit_logs (
    audit_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    user_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    description TEXT NOT NULL,
    ip_address VARCHAR(50) NULL,
    user_agent VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
