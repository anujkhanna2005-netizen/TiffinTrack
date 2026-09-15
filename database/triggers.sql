-- ============================================================
-- TiffinTrack Database Triggers (database/triggers.sql)
-- ============================================================

USE tiffintrack;

DROP TRIGGER IF EXISTS trg_after_rating_insert;
DROP TRIGGER IF EXISTS trg_after_rating_update;
DROP TRIGGER IF EXISTS trg_after_rating_delete;

DELIMITER //

-- Recalculate Vendor.avg_rating after new rating inserted
CREATE TRIGGER trg_after_rating_insert
AFTER INSERT ON ratings
FOR EACH ROW
BEGIN
    DECLARE new_avg DECIMAL(3,2);
    
    SELECT COALESCE(ROUND(AVG(weighted_score), 2), 0.00)
    INTO new_avg
    FROM ratings
    WHERE vendor_id = NEW.vendor_id AND status = 'active';
    
    UPDATE vendors
    SET avg_rating = new_avg
    WHERE vendor_id = NEW.vendor_id;
END //

-- Recalculate Vendor.avg_rating after rating updated (e.g. score change or admin moderation)
CREATE TRIGGER trg_after_rating_update
AFTER UPDATE ON ratings
FOR EACH ROW
BEGIN
    DECLARE new_avg DECIMAL(3,2);
    
    SELECT COALESCE(ROUND(AVG(weighted_score), 2), 0.00)
    INTO new_avg
    FROM ratings
    WHERE vendor_id = NEW.vendor_id AND status = 'active';
    
    UPDATE vendors
    SET avg_rating = new_avg
    WHERE vendor_id = NEW.vendor_id;
END //

-- Recalculate Vendor.avg_rating after rating deleted
CREATE TRIGGER trg_after_rating_delete
AFTER DELETE ON ratings
FOR EACH ROW
BEGIN
    DECLARE new_avg DECIMAL(3,2);
    
    SELECT COALESCE(ROUND(AVG(weighted_score), 2), 0.00)
    INTO new_avg
    FROM ratings
    WHERE vendor_id = OLD.vendor_id AND status = 'active';
    
    UPDATE vendors
    SET avg_rating = new_avg
    WHERE vendor_id = OLD.vendor_id;
END //

DELIMITER ;
