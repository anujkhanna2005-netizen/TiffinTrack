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


-- ============================================================
-- TiffinTrack Comprehensive Seed Data (database/seed.sql)
-- Password for all demo accounts is 'demo123'
-- ============================================================

USE tiffintrack;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE audit_logs;
TRUNCATE TABLE group_subscriptions;
TRUNCATE TABLE menu_votes;
TRUNCATE TABLE vendor_switch_logs;
TRUNCATE TABLE ratings;
TRUNCATE TABLE complaints;
TRUNCATE TABLE skip_requests;
TRUNCATE TABLE payments;
TRUNCATE TABLE deliveries;
TRUNCATE TABLE daily_menus;
TRUNCATE TABLE subscriptions;
TRUNCATE TABLE meal_plans;
TRUNCATE TABLE delivery_agents;
TRUNCATE TABLE vendors;
TRUNCATE TABLE customers;
TRUNCATE TABLE sessions;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. USERS
-- Admin, 5 Vendors, 3 Delivery Agents, 15 Students
INSERT INTO users (user_id, email, password_hash, role, status) VALUES
-- Admin
(1, 'admin@tiffintrack.demo', '/Sf2N0FDhKuqAq16dHJpQv69kgHXqplTgHjNAXr5Jm', 'admin', 'active'),
-- Vendors
(2, 'vendor@tiffintrack.demo', '/Sf2N0FDhKuqAq16dHJpQv69kgHXqplTgHjNAXr5Jm', 'vendor', 'active'),
(3, 'hometaste@tiffintrack.demo', '/Sf2N0FDhKuqAq16dHJpQv69kgHXqplTgHjNAXr5Jm', 'vendor', 'active'),
(4, 'maas@tiffintrack.demo', '/Sf2N0FDhKuqAq16dHJpQv69kgHXqplTgHjNAXr5Jm', 'vendor', 'active'),
(5, 'healthybite@tiffintrack.demo', '/Sf2N0FDhKuqAq16dHJpQv69kgHXqplTgHjNAXr5Jm', 'vendor', 'active'),
(6, 'campusmeals@tiffintrack.demo', '/Sf2N0FDhKuqAq16dHJpQv69kgHXqplTgHjNAXr5Jm', 'vendor', 'active'),
-- Delivery Agents
(7, 'agent@tiffintrack.demo', '/Sf2N0FDhKuqAq16dHJpQv69kgHXqplTgHjNAXr5Jm', 'delivery_agent', 'active'),
(8, 'suresh@tiffintrack.demo', '/Sf2N0FDhKuqAq16dHJpQv69kgHXqplTgHjNAXr5Jm', 'delivery_agent', 'active'),
(9, 'vikram@tiffintrack.demo', '/Sf2N0FDhKuqAq16dHJpQv69kgHXqplTgHjNAXr5Jm', 'delivery_agent', 'active'),
-- Students (15)
(10, 'student@tiffintrack.demo', '/Sf2N0FDhKuqAq16dHJpQv69kgHXqplTgHjNAXr5Jm', 'customer', 'active'),
(11, 'priya@tiffintrack.demo', '/Sf2N0FDhKuqAq16dHJpQv69kgHXqplTgHjNAXr5Jm', 'customer', 'active'),
(12, 'arjun@tiffintrack.demo', '/Sf2N0FDhKuqAq16dHJpQv69kgHXqplTgHjNAXr5Jm', 'customer', 'active'),
(13, 'sneha@tiffintrack.demo', '/Sf2N0FDhKuqAq16dHJpQv69kgHXqplTgHjNAXr5Jm', 'customer', 'active'),
(14, 'rohit@tiffintrack.demo', '/Sf2N0FDhKuqAq16dHJpQv69kgHXqplTgHjNAXr5Jm', 'customer', 'active'),
(15, 'ananya@tiffintrack.demo', '/Sf2N0FDhKuqAq16dHJpQv69kgHXqplTgHjNAXr5Jm', 'customer', 'active'),
(16, 'deepak@tiffintrack.demo', '/Sf2N0FDhKuqAq16dHJpQv69kgHXqplTgHjNAXr5Jm', 'customer', 'active'),
(17, 'pooja@tiffintrack.demo', '/Sf2N0FDhKuqAq16dHJpQv69kgHXqplTgHjNAXr5Jm', 'customer', 'active'),
(18, 'kunal@tiffintrack.demo', '/Sf2N0FDhKuqAq16dHJpQv69kgHXqplTgHjNAXr5Jm', 'customer', 'active'),
(19, 'riya@tiffintrack.demo', '/Sf2N0FDhKuqAq16dHJpQv69kgHXqplTgHjNAXr5Jm', 'customer', 'active'),
(20, 'manish@tiffintrack.demo', '/Sf2N0FDhKuqAq16dHJpQv69kgHXqplTgHjNAXr5Jm', 'customer', 'active'),
(21, 'tanvi@tiffintrack.demo', '/Sf2N0FDhKuqAq16dHJpQv69kgHXqplTgHjNAXr5Jm', 'customer', 'active'),
(22, 'harsh@tiffintrack.demo', '/Sf2N0FDhKuqAq16dHJpQv69kgHXqplTgHjNAXr5Jm', 'customer', 'active'),
(23, 'divya@tiffintrack.demo', '/Sf2N0FDhKuqAq16dHJpQv69kgHXqplTgHjNAXr5Jm', 'customer', 'active'),
(24, 'yash@tiffintrack.demo', '/Sf2N0FDhKuqAq16dHJpQv69kgHXqplTgHjNAXr5Jm', 'customer', 'active');

-- 2. VENDORS
INSERT INTO vendors (vendor_id, user_id, name, kitchen_address, locality, license_no, contact, cuisine_type, avg_rating, status) VALUES
('V001', 2, 'Annapurna Tiffin Services', 'Plot 42, Zone 1, MP Nagar', 'MP Nagar', 'FSSAI-MP-2024-001', '+91 98765 43210', 'North Indian, Homestyle', 4.40, 'active'),
('V002', 3, 'HomeTaste Kitchen', 'Shop 7, B-Sector, Indrapuri', 'Indrapuri', 'FSSAI-MP-2024-002', '+91 98765 43211', 'South Indian, Gujarati', 4.70, 'active'),
('V003', 4, 'Maa\'s Kitchen', 'Near C-Block Market, Ayodhya Bypass', 'Ayodhya Bypass', 'FSSAI-MP-2024-003', '+91 98765 43212', 'North Indian, Rajasthani', 4.10, 'active'),
('V004', 5, 'HealthyBite Tiffins', 'Flat 102, Green Glen, MP Nagar', 'MP Nagar', 'FSSAI-MP-2024-004', '+91 98765 43213', 'Diet & High-Protein', 4.50, 'active'),
('V005', 6, 'Campus Meals', 'Near Gate 2, Indrapuri', 'Indrapuri', 'FSSAI-MP-2024-005', '+91 98765 43214', 'Multi-Cuisine Student Budget', 3.90, 'active');

-- 3. DELIVERY AGENTS
INSERT INTO delivery_agents (agent_id, user_id, name, phone, assigned_locality, vehicle_type, status) VALUES
('A001', 7, 'Amit Kumar', '+91 98260 11223', 'MP Nagar', 'Electric Scooter', 'active'),
('A002', 8, 'Suresh Patel', '+91 98260 11224', 'Indrapuri', 'Motorcycle', 'active'),
('A003', 9, 'Vikram Sharma', '+91 98260 11225', 'Ayodhya Bypass', 'Bicycle', 'active');

-- 4. CUSTOMERS (15 Students)
INSERT INTO customers (customer_id, user_id, name, phone, email, pg_or_flat_name, locality, room_no, dietary_pref, wallet_balance) VALUES
('C001', 10, 'Rahul Sharma', '+91 91234 56780', 'student@tiffintrack.demo', 'Sunrise Boys PG', 'MP Nagar', 'Room 204', 'Veg, Low Spice', 3500.00),
('C002', 11, 'Priya Verma', '+91 91234 56781', 'priya@tiffintrack.demo', 'Girls PG Enclave', 'Indrapuri', 'Room 102', 'Veg, Jain Option', 2800.00),
('C003', 12, 'Arjun Mehta', '+91 91234 56782', 'arjun@tiffintrack.demo', 'Sunrise Boys PG', 'MP Nagar', 'Room 305', 'Non-Veg', 4200.00),
('C004', 13, 'Sneha Patel', '+91 91234 56783', 'sneha@tiffintrack.demo', 'Royal Residency PG', 'Ayodhya Bypass', 'Flat 401', 'High Protein, Veg', 1950.00),
('C005', 14, 'Rohit Singh', '+91 91234 56784', 'rohit@tiffintrack.demo', 'Sunrise Boys PG', 'MP Nagar', 'Room 108', 'Veg', 2100.00),
('C006', 15, 'Ananya Sen', '+91 91234 56785', 'ananya@tiffintrack.demo', 'Girls PG Enclave', 'Indrapuri', 'Room 205', 'Pure Veg', 3000.00),
('C007', 16, 'Deepak Joshi', '+91 91234 56786', 'deepak@tiffintrack.demo', 'Sunrise Boys PG', 'MP Nagar', 'Room 210', 'Veg, No Onion', 1500.00),
('C008', 17, 'Pooja Reddy', '+91 91234 56787', 'pooja@tiffintrack.demo', 'Royal Residency PG', 'Ayodhya Bypass', 'Flat 302', 'Veg', 2750.00),
('C009', 18, 'Kunal Nair', '+91 91234 56788', 'kunal@tiffintrack.demo', 'Sunrise Boys PG', 'MP Nagar', 'Room 301', 'Non-Veg', 3100.00),
('C010', 19, 'Riya Gupta', '+91 91234 56789', 'riya@tiffintrack.demo', 'Girls PG Enclave', 'Indrapuri', 'Room 108', 'Veg', 2200.00),
('C011', 20, 'Manish Tiwari', '+91 91234 56790', 'manish@tiffintrack.demo', 'Bhopal Student Flats', 'MP Nagar', 'Flat 502', 'Veg', 1800.00),
('C012', 21, 'Tanvi Saxena', '+91 91234 56791', 'tanvi@tiffintrack.demo', 'Girls PG Enclave', 'Indrapuri', 'Room 304', 'Veg, Low Oil', 2600.00),
('C013', 22, 'Harsh Vardhan', '+91 91234 56792', 'harsh@tiffintrack.demo', 'Sunrise Boys PG', 'MP Nagar', 'Room 402', 'Non-Veg', 3400.00),
('C014', 23, 'Divya Mishra', '+91 91234 56793', 'divya@tiffintrack.demo', 'Royal Residency PG', 'Ayodhya Bypass', 'Flat 201', 'Veg', 1900.00),
('C015', 24, 'Yash Goyal', '+91 91234 56794', 'yash@tiffintrack.demo', 'Bhopal Student Flats', 'MP Nagar', 'Flat 101', 'Veg', 2500.00);

-- 5. MEAL PLANS
INSERT INTO meal_plans (plan_id, vendor_id, name, plan_type, price, meals_included, veg_or_nonveg, description, status) VALUES
('P001', 'V001', 'Monthly Standard Lunch', 'monthly', 2400.00, 30, 'veg', '4 Roti, Dal Tadka, Sabzi of the day, Jeera Rice, Salad', 'active'),
('P002', 'V001', 'Monthly Full Day (Lunch + Dinner)', 'monthly', 4500.00, 60, 'veg', 'Lunch & Dinner 6 days a week + Sunday Special Meal', 'active'),
('P003', 'V001', 'Weekly Veg Trial', 'weekly', 650.00, 7, 'veg', '7 days complete lunch trial box', 'active'),
('P004', 'V002', 'South Indian Deluxe Monthly', 'monthly', 2200.00, 30, 'veg', 'Sambar, Rasam, 2 Sabzis, Rice, Curd, Appalam', 'active'),
('P005', 'V002', 'Weekly South Indian Plan', 'weekly', 600.00, 7, 'veg', 'Authentic homely South Indian lunch', 'active'),
('P006', 'V003', 'Royal Homestyle Monthly', 'monthly', 2600.00, 30, 'both', 'Rajasthani & North Indian combo with Ghee Phulkas', 'active'),
('P007', 'V004', 'High Protein Diet Plan', 'monthly', 3200.00, 30, 'both', 'Paneer/Sprouts/Eggs, Multigrain Roti, Brown Rice, Dal', 'active'),
('P008', 'V005', 'Student Budget Monthly', 'monthly', 1800.00, 30, 'veg', 'Wholesome student budget lunch box with 4 Rotis and Dal Sabzi', 'active');

-- 6. SUBSCRIPTIONS
INSERT INTO subscriptions (sub_id, customer_id, plan_id, vendor_id, start_date, end_date, status, auto_renew) VALUES
('S001', 'C001', 'P001', 'V001', CURRENT_DATE - INTERVAL 10 DAY, CURRENT_DATE + INTERVAL 20 DAY, 'active', TRUE),
('S002', 'C002', 'P004', 'V002', CURRENT_DATE - INTERVAL 15 DAY, CURRENT_DATE + INTERVAL 15 DAY, 'active', TRUE),
('S003', 'C003', 'P001', 'V001', CURRENT_DATE - INTERVAL 5 DAY, CURRENT_DATE + INTERVAL 25 DAY, 'active', FALSE),
('S004', 'C004', 'P007', 'V004', CURRENT_DATE - INTERVAL 8 DAY, CURRENT_DATE + INTERVAL 22 DAY, 'active', TRUE),
('S005', 'C005', 'P001', 'V001', CURRENT_DATE - INTERVAL 12 DAY, CURRENT_DATE + INTERVAL 18 DAY, 'active', TRUE),
('S006', 'C006', 'P004', 'V002', CURRENT_DATE - INTERVAL 20 DAY, CURRENT_DATE + INTERVAL 10 DAY, 'active', TRUE),
('S007', 'C007', 'P001', 'V001', CURRENT_DATE - INTERVAL 3 DAY, CURRENT_DATE + INTERVAL 27 DAY, 'active', FALSE),
('S008', 'C008', 'P006', 'V003', CURRENT_DATE - INTERVAL 14 DAY, CURRENT_DATE + INTERVAL 16 DAY, 'active', TRUE),
('S009', 'C009', 'P001', 'V001', CURRENT_DATE - INTERVAL 2 DAY, CURRENT_DATE + INTERVAL 28 DAY, 'active', TRUE),
('S010', 'C010', 'P004', 'V002', CURRENT_DATE - INTERVAL 7 DAY, CURRENT_DATE + INTERVAL 23 DAY, 'active', FALSE),
('S011', 'C011', 'P008', 'V005', CURRENT_DATE - INTERVAL 18 DAY, CURRENT_DATE + INTERVAL 12 DAY, 'active', TRUE),
('S012', 'C012', 'P004', 'V002', CURRENT_DATE - INTERVAL 22 DAY, CURRENT_DATE + INTERVAL 8 DAY, 'active', TRUE),
('S013', 'C013', 'P001', 'V001', CURRENT_DATE - INTERVAL 1 DAY, CURRENT_DATE + INTERVAL 29 DAY, 'active', TRUE);

-- 7. GROUP SUBSCRIPTIONS (Add-on 6)
INSERT INTO group_subscriptions (group_id, residence_name, locality, vendor_id, member_count, discount_applied, discount_percent, formed_date) VALUES
('G001', 'Sunrise Boys PG', 'MP Nagar', 'V001', 6, TRUE, 10.00, CURRENT_DATE - INTERVAL 10 DAY),
('G002', 'Girls PG Enclave', 'Indrapuri', 'V002', 4, TRUE, 5.00, CURRENT_DATE - INTERVAL 15 DAY);

-- 8. DAILY MENUS (JSON Array format)
INSERT INTO daily_menus (menu_id, vendor_id, date, meal_type, items, published) VALUES
('M001', 'V001', CURRENT_DATE, 'lunch', JSON_ARRAY('4 Butter Phulkas', 'Paneer Butter Masala', 'Yellow Dal Tadka', 'Jeera Rice', 'Cucumber Raita', 'Gulab Jamun'), TRUE),
('M002', 'V002', CURRENT_DATE, 'lunch', JSON_ARRAY('Steamed Rice', 'Drumstick Sambar', 'Mysore Rasam', 'Cabbage Poriyal', 'Curd', 'Appalam'), TRUE),
('M003', 'V003', CURRENT_DATE, 'lunch', JSON_ARRAY('4 Desi Ghee Roti', 'Sev Tamatar Sabzi', 'Dal Bati Churna', 'Steamed Rice', 'Papad'), TRUE),
('M004', 'V004', CURRENT_DATE, 'lunch', JSON_ARRAY('3 Multigrain Rotis', 'Grilled Paneer Cubes', 'Moong Dal Sprouts', 'Brown Rice', 'Green Salad'), TRUE),
('M005', 'V005', CURRENT_DATE, 'lunch', JSON_ARRAY('4 Tawa Roti', 'Aloo Gobhi Masala', 'Chana Dal', 'Plain Rice', 'Onion Salad'), TRUE);

-- 9. DELIVERIES
INSERT INTO deliveries (delivery_id, subscription_id, agent_id, date, meal_type, status, delivered_time, notes) VALUES
('D001', 'S001', 'A001', CURRENT_DATE, 'lunch', 'out_for_delivery', NULL, 'Drop at Sunrise PG Room 204'),
('D002', 'S002', 'A002', CURRENT_DATE, 'lunch', 'delivered', CURRENT_TIMESTAMP - INTERVAL 30 MINUTE, 'Left at guard desk'),
('D003', 'S003', 'A001', CURRENT_DATE, 'lunch', 'pending', NULL, 'Deliver by 1:30 PM'),
('D004', 'S004', 'A003', CURRENT_DATE, 'lunch', 'pending', NULL, 'Call before arriving'),
('D005', 'S005', 'A001', CURRENT_DATE, 'lunch', 'out_for_delivery', NULL, 'Room 108'),
('D006', 'S001', 'A001', CURRENT_DATE - INTERVAL 1 DAY, 'lunch', 'delivered', CURRENT_TIMESTAMP - INTERVAL 25 HOUR, 'Delivered on time'),
('D007', 'S001', 'A001', CURRENT_DATE - INTERVAL 2 DAY, 'lunch', 'delivered', CURRENT_TIMESTAMP - INTERVAL 49 HOUR, 'Delivered on time');

-- 10. PAYMENTS
INSERT INTO payments (payment_id, customer_id, subscription_id, amount, date, mode, status) VALUES
('PAY001', 'C001', 'S001', 2400.00, CURRENT_DATE - INTERVAL 10 DAY, 'wallet', 'success'),
('PAY002', 'C002', 'S002', 2200.00, CURRENT_DATE - INTERVAL 15 DAY, 'upi', 'success'),
('PAY003', 'C003', 'S003', 2400.00, CURRENT_DATE - INTERVAL 5 DAY, 'wallet', 'success'),
('PAY004', 'C004', 'S004', 3200.00, CURRENT_DATE - INTERVAL 8 DAY, 'upi', 'success'),
('PAY005', 'C005', 'S005', 2400.00, CURRENT_DATE - INTERVAL 12 DAY, 'wallet', 'success');

-- 11. RATINGS
INSERT INTO ratings (rating_id, customer_id, vendor_id, subscription_id, taste_score, hygiene_score, punctuality_score, value_score, weighted_score, review_text, date, status) VALUES
('R001', 'C001', 'V001', 'S001', 5, 4, 4, 5, 4.50, 'Really authentic taste! The Dal Tadka reminds me of home.', CURRENT_DATE - INTERVAL 2 DAY, 'active'),
('R002', 'C002', 'V002', 'S002', 5, 5, 4, 5, 4.75, 'Best South Indian food near Indrapuri. Sambar is top notch.', CURRENT_DATE - INTERVAL 4 DAY, 'active'),
('R003', 'C003', 'V001', 'S003', 4, 4, 5, 4, 4.25, 'Super punctual delivery every day before 1:00 PM.', CURRENT_DATE - INTERVAL 1 DAY, 'active'),
('R004', 'C005', 'V001', 'S005', 4, 5, 4, 5, 4.40, 'Hygiene is great, packaging in steel containers is eco-friendly.', CURRENT_DATE - INTERVAL 3 DAY, 'active'),
('R005', 'C004', 'V004', 'S004', 5, 5, 4, 4, 4.60, 'Very healthy food for gym goers. Sprouts are always fresh.', CURRENT_DATE - INTERVAL 5 DAY, 'active');

-- 12. COMPLAINTS
INSERT INTO complaints (complaint_id, customer_id, delivery_id, vendor_id, issue_type, description, status, resolved_date) VALUES
('CMP001', 'C001', 'D007', 'V001', 'late_delivery', 'Tiffin arrived 30 mins late on Monday afternoon.', 'resolved', CURRENT_DATE - INTERVAL 1 DAY),
('CMP002', 'C004', 'D004', 'V004', 'packaging_issue', 'Gravy container lid was loose, minor spillage.', 'open', NULL),
('CMP003', 'C011', NULL, 'V005', 'food_quality', 'Rice was slightly undercooked yesterday.', 'in_review', NULL);

-- 13. SKIP REQUESTS
INSERT INTO skip_requests (skip_id, subscription_id, customer_id, date, reason, refund_amount, refund_credited, applied_to_next_bill) VALUES
('SKP001', 'S001', 'C001', CURRENT_DATE + INTERVAL 3 DAY, 'Going home to Indore for weekend', 80.00, TRUE, FALSE);

-- 14. AUDIT LOGS
INSERT INTO audit_logs (audit_id, user_id, user_role, action, entity_type, entity_id, description) VALUES
(1, 10, 'customer', 'LOGIN', 'users', '10', 'Student Rahul Sharma logged in'),
(2, 10, 'customer', 'CREATE_SUBSCRIPTION', 'subscriptions', 'S001', 'Subscribed to Monthly Standard Lunch (V001)'),
(3, 1, 'admin', 'SYSTEM_INIT', 'system', '0', 'System seeded with academic baseline dataset');


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


-- ============================================================
-- TiffinTrack Views (database/views.sql)
-- ============================================================

USE tiffintrack;

-- 1. Top Rated Vendors View (Add-on 1 / Master Plan Sec 4.1)
-- Joins Vendor + Rating, calculates weighted avg, HAVING COUNT(rating_id) >= 5 (or >= 1 in test environment)
CREATE OR REPLACE VIEW top_rated_vendors AS
SELECT 
    v.vendor_id,
    v.name AS vendor_name,
    v.locality,
    v.cuisine_type,
    COUNT(r.rating_id) AS total_reviews,
    ROUND(AVG(r.taste_score), 1) AS avg_taste,
    ROUND(AVG(r.hygiene_score), 1) AS avg_hygiene,
    ROUND(AVG(r.punctuality_score), 1) AS avg_punctuality,
    ROUND(AVG(r.value_score), 1) AS avg_value,
    ROUND(AVG(r.weighted_score), 2) AS calculated_rating,
    v.avg_rating AS stored_avg_rating
FROM vendors v
LEFT JOIN ratings r ON v.vendor_id = r.vendor_id AND r.status = 'active'
WHERE v.status = 'active'
GROUP BY v.vendor_id, v.name, v.locality, v.cuisine_type, v.avg_rating;

-- 2. Complaint-Rating Trend View (Add-on 4: Complaint-Rating Dashboard)
-- Aggregates monthly complaints and ratings per vendor to detect rising complaints + declining ratings
CREATE OR REPLACE VIEW complaint_trend AS
SELECT 
    v.vendor_id,
    v.name AS vendor_name,
    v.locality,
    v.avg_rating AS current_overall_rating,
    COUNT(DISTINCT c.complaint_id) AS total_complaints,
    SUM(CASE WHEN c.status = 'open' THEN 1 ELSE 0 END) AS pending_complaints,
    COUNT(DISTINCT r.rating_id) AS total_ratings,
    ROUND(AVG(r.weighted_score), 2) AS avg_rating,
    CASE 
        WHEN COUNT(DISTINCT c.complaint_id) >= 3 AND AVG(r.weighted_score) < 3.5 THEN 'CRITICAL'
        WHEN COUNT(DISTINCT c.complaint_id) >= 2 OR AVG(r.weighted_score) < 4.0 THEN 'WARNING'
        ELSE 'STABLE'
    END AS concern_level
FROM vendors v
LEFT JOIN complaints c ON v.vendor_id = c.vendor_id
LEFT JOIN ratings r ON v.vendor_id = r.vendor_id AND r.status = 'active'
GROUP BY v.vendor_id, v.name, v.locality, v.avg_rating;

-- 3. Vendor Performance Summary View
CREATE OR REPLACE VIEW vendor_performance_summary AS
SELECT 
    v.vendor_id,
    v.name AS vendor_name,
    v.locality,
    v.status,
    COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.sub_id END) AS active_subscribers,
    COUNT(DISTINCT s.sub_id) AS total_subscribers_all_time,
    COALESCE(SUM(p.amount), 0.00) AS total_revenue,
    COUNT(DISTINCT CASE WHEN d.status = 'pending' AND d.date = CURRENT_DATE THEN d.delivery_id END) AS pending_deliveries_today,
    COUNT(DISTINCT CASE WHEN d.status = 'delivered' AND d.date = CURRENT_DATE THEN d.delivery_id END) AS delivered_today
FROM vendors v
LEFT JOIN subscriptions s ON v.vendor_id = s.vendor_id
LEFT JOIN payments p ON s.sub_id = p.subscription_id AND p.status = 'success'
LEFT JOIN deliveries d ON s.sub_id = d.subscription_id
GROUP BY v.vendor_id, v.name, v.locality, v.status;
