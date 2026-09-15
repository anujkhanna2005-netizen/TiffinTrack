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
