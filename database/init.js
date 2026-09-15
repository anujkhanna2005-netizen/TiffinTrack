const mysql = require('./node_modules/mysql2/promise');
const fs = require('fs');

async function run() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12ab34cdAnuj@4504',
    multipleStatements: true
  });

  console.log('Executing schema.sql...');
  await conn.query(fs.readFileSync('database/schema.sql', 'utf8'));

  console.log('Executing indexes.sql...');
  try {
    await conn.query(fs.readFileSync('database/indexes.sql', 'utf8'));
  } catch (e) {
    console.log('Indexes note (already exist):', e.message);
  }

  console.log('Executing views.sql...');
  await conn.query(fs.readFileSync('database/views.sql', 'utf8'));

  console.log('Executing triggers.sql...');
  await conn.query('USE tiffintrack');
  await conn.query('DROP TRIGGER IF EXISTS trg_after_rating_insert');
  await conn.query('DROP TRIGGER IF EXISTS trg_after_rating_update');
  await conn.query('DROP TRIGGER IF EXISTS trg_after_rating_delete');

  await conn.query(
    CREATE TRIGGER trg_after_rating_insert
    AFTER INSERT ON ratings
    FOR EACH ROW
    BEGIN
        DECLARE new_avg DECIMAL(3,2);
        SELECT COALESCE(ROUND(AVG(weighted_score), 2), 0.00)
        INTO new_avg
        FROM ratings
        WHERE vendor_id = NEW.vendor_id AND status = 'active';
        UPDATE vendors SET avg_rating = new_avg WHERE vendor_id = NEW.vendor_id;
    END;
  );

  await conn.query(
    CREATE TRIGGER trg_after_rating_update
    AFTER UPDATE ON ratings
    FOR EACH ROW
    BEGIN
        DECLARE new_avg DECIMAL(3,2);
        SELECT COALESCE(ROUND(AVG(weighted_score), 2), 0.00)
        INTO new_avg
        FROM ratings
        WHERE vendor_id = NEW.vendor_id AND status = 'active';
        UPDATE vendors SET avg_rating = new_avg WHERE vendor_id = NEW.vendor_id;
    END;
  );

  await conn.query(
    CREATE TRIGGER trg_after_rating_delete
    AFTER DELETE ON ratings
    FOR EACH ROW
    BEGIN
        DECLARE new_avg DECIMAL(3,2);
        SELECT COALESCE(ROUND(AVG(weighted_score), 2), 0.00)
        INTO new_avg
        FROM ratings
        WHERE vendor_id = OLD.vendor_id AND status = 'active';
        UPDATE vendors SET avg_rating = new_avg WHERE vendor_id = OLD.vendor_id;
    END;
  );

  console.log('Executing seed.sql...');
  await conn.query(fs.readFileSync('database/seed.sql', 'utf8'));

  console.log('DATABASE INITIALIZATION SUCCESSFUL!');
  const [tables] = await conn.query('SHOW TABLES IN tiffintrack');
  console.log('Total tables & views in tiffintrack:', tables.length);
  await conn.end();
}

run().catch(err => {
  console.error('INIT ERROR:', err);
  process.exit(1);
});
