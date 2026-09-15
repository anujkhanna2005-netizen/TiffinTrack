# TiffinTrack — Smart Tiffin Subscription & Delivery Management System

> **A Complete Relational DBMS & Full-Stack Web Application for PG and Flat-Based College Students**  
> **DBMS Course Project — 3-Role Production Architecture**

---

## 🚀 Live Demo & Deployment
- **Live Deployment:** [https://tiffin-track-weld.vercel.app/](https://tiffin-track-weld.vercel.app/)
- **Repository:** [https://github.com/anujkhanna2005-netizen/TiffinTrack.git](https://github.com/anujkhanna2005-netizen/TiffinTrack.git)
- **Database Engine:** MySQL / TiDB Cloud (Serverless Relational Engine)

---

## 🏛️ System Architecture: 3 Core Roles (PATH B Architecture)

TiffinTrack streamlines meal subscription and fulfillment by adopting a modern **3-Role Operational Architecture**:

1. 🎓 **Student / Customer**: Discovers local vendors, subscribes to meal plans, tracks daily delivery stages, manages dietary preferences, skips meals for wallet credits, votes on weekly menus, and forms flat groups for collective discounts.
2. 🍲 **Vendor / Kitchen Partner**: Manages meal plans, publishes daily dynamic menus, monitors active subscriber rosters, reviews student feedback/complaints, and **directly manages fulfillment and delivery lifecycle** (`Prepared` ➔ `Dispatched` ➔ `Delivered`).
3. 🛡️ **Admin**: Oversees platform compliance, manages user rosters, monitors complaint resolution metrics, audits system activity logs, and inspects database health.

> **Academic Schema Compatibility (PATH B):**  
> For complete alignment with the Academic DBMS Course Plan & ER Diagram grading, the relational schema preserves the historical `delivery_agents` table and maintains `deliveries.agent_id` as a nullable foreign key. The runtime application cleanly routes all order preparation and dispatch lifecycle operations directly through the verified Vendor portal.

---

## 🔑 Demo Credentials

| Role | Email | Password | Scope |
|------|-------|----------|-------|
| 🎓 **Student** | `student@tiffintrack.demo` | `demo123` | Full student dashboard, meal tracker, add-ons |
| 🍲 **Vendor** | `vendor@tiffintrack.demo` | `demo123` | Menu editor, subscriber roster, delivery fulfillment |
| 🛡️ **Admin** | `admin@tiffintrack.demo` | `demo123` | Platform analytics, audit logs, DBMS viva showcase |

---

## ✨ Key Features & Add-ons

- 🔒 **Secure Session Authentication:** SHA-256 token hashing, `httpOnly` secure session cookies, role-based route guards, and automated audit logging.
- ⚡ **Vendor 1-Click Fulfillment:** Vendors manage delivery status in real-time (`prepared`, `dispatched`, `delivered`) with strict vendor-isolation checks.
- 📦 **Add-on 1: Pause & Skip Meals:** Students can skip upcoming meal slots and receive automated ₹80 wallet credit.
- 🗳️ **Add-on 2: Weekly Menu Voting:** Democratic student voting for weekend special menus with live tallying.
- 👥 **Add-on 3: Flat Group Subscriptions:** Group order pooling with automated 10% group discounts for roommates.
- 🌶️ **Add-on 4: Meal Customization:** Real-time spice preferences, non-veg/veg filter, and Jain (no onion/garlic) toggles.
- 🔄 **Add-on 5: 1-Click Vendor Switch (ACID Transaction):** Seamlessly migrate active subscriptions to a new vendor with atomic `BEGIN ... COMMIT / ROLLBACK` guarantees.
- 📊 **Add-on 6: Live Fulfillment Tracker:** Real-time progress bar reflecting the vendor's kitchen and delivery updates.

---

## 🗄️ DBMS Core Concepts Implemented

1. **Relational Schema Design & 3NF Normalization:** 12 interconnected tables enforcing primary keys, foreign key constraints, and cascade integrity.
2. **B-Tree Indexes:** High-performance index optimization on `idx_user_email`, `idx_sub_customer`, `idx_del_sub_date`, and composite keys.
3. **Database Views:**
   - `top_rated_vendors`: Real-time rating aggregator with rating count thresholds.
   - `complaint_trend`: Aggregated complaint resolution monitoring.
   - `vendor_performance_summary`: Cross-table analysis of subscriber retention and active orders.
4. **SQL Triggers:**
   - `after_rating_insert` & `after_rating_update`: Automatically recomputes the vendor's composite rating whenever reviews are submitted or modified.
5. **ACID Transactions:** Full database transaction support with rollbacks on failure for payments, group joining, and vendor switching.
6. **Live Audit Trail:** Complete database-backed audit log capturing IP, user agent, actor role, timestamp, and entity mutations.

---

## 🧪 Testing & Verification

Run the comprehensive automated test suite (29 test cases covering all 3 roles, authentication guards, ACID transactions, vendor ownership checks, and DBMS endpoints):

```bash
# Run automated full-system tests
node test_all_phases.js
```

---

## 💻 Tech Stack
- **Backend:** Node.js, Express.js, MySQL2 (`mysql2/promise`), TiDB Cloud
- **Frontend:** Vanilla JavaScript (SPA Component Architecture), HTML5, CSS3 Glassmorphism UI
- **Deployment:** Vercel Serverless Functions (`api/index.js`) + TiDB Serverless Cloud
