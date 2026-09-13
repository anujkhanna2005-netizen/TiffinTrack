Selected Stack: Vanilla HTML + CSS + JavaScript + Node.js + Express.js

# TiffinTrack — Preview Model V1

> A Tiffin Subscription & Delivery Management System for PG and Flat-Based College Students  
> **DBMS Course Project — 2nd Year | Preview V1**

---

## Project Overview

TiffinTrack connects college students living in PGs and rented flats with local tiffin vendors.  
Students can browse vendors, subscribe to meal plans, track deliveries, rate vendors, and submit complaints.  
Vendors manage their menus, subscribers, and delivery operations.  
A delivery agent marks deliveries as completed.  
An admin views platform-wide data.

This is **Preview Model V1** — a functional academic prototype for validating the application structure, data flow, and DBMS concepts. It is NOT the final submission.

---

## Preview V1 Scope — Features Implemented

- ✅ Demo Role Switcher (Student / Vendor / Delivery Agent / Admin)
- ✅ Student Dashboard (greeting, subscription card, today's meal, quick actions)
- ✅ Find Tiffin page (vendor cards with ratings, subscriber count)
- ✅ Vendor Details page (rating breakdown, meal plans, today's menu, reviews)
- ✅ Subscription flow: Browse → Select Plan → Confirm → ACTIVE
- ✅ Duplicate subscription blocked: "Cancel current plan first"
- ✅ Subscription cancellation with animated step display
- ✅ My Subscription page (full plan details, days remaining)
- ✅ Today's Meal page (delivery tracker + vendor's menu)
- ✅ Star Rating system (4 categories, weighted formula, live overall preview)
- ✅ Complaint submission (6 issue types, complaint history with IDs)
- ✅ Vendor Dashboard (all stats computed from data, not hardcoded)
- ✅ Vendor Meal Plans page
- ✅ Vendor Today's Menu (add / delete / publish menu items)
- ✅ Vendor Subscribers, Deliveries, Ratings, Complaints pages
- ✅ Delivery Agent Dashboard (mark out for delivery / mark delivered)
- ✅ Agent Today's Deliveries + Delivery History
- ✅ Admin Dashboard (platform stats, vendor performance, complaint overview)
- ✅ Admin Vendors, Customers, Complaints, Ratings pages
- ✅ DBMS Demo page: JOIN, GROUP BY, VIEW, TRANSACTION (interactive)

---

## Features Intentionally Deferred (NOT in Preview V1)

- MySQL / real database (mock data only in V1)
- TRIGGER and stored procedures (required in final submission — Phase 2)
- Full 12-table relational schema, schema.sql, demo_queries.sql
- ER diagram and normalization page
- Smart Vendor Switching, Menu Voting, Group Discount, Meal Skip
- Concurrency demo (SELECT ... FOR UPDATE, locking)
- Indexing demo, B+ Tree visualization
- Payment gateway, real authentication (JWT / OAuth)
- Real GPS tracking, maps, route optimization
- Production deployment, Docker, microservices

---

## Technology Stack

| Layer      | Technology                     |
|------------|-------------------------------|
| Frontend   | Vanilla HTML, CSS, JavaScript |
| Backend    | Node.js + Express.js          |
| Database   | None (in-memory mock data)    |
| Fonts      | Google Fonts — Inter          |

> **MySQL is intentionally not used in Preview V1.**  
> All data lives in `server/data/mockData.js`.

---

## Project Structure

```
TiffinTrack/
│
├── server/
│   ├── server.js              # Express server — serves static files + API
│   ├── routes/
│   │   └── api.js             # All API route handlers
│   └── data/
│       └── mockData.js        # SINGLE SOURCE OF TRUTH — all mock data
│
├── public/
│   ├── index.html             # Single HTML shell
│   ├── css/
│   │   └── style.css          # All styles
│   └── js/
│       ├── app.js             # Router, role tracking, shared helpers
│       ├── service.js         # Service layer — all API communication
│       └── pages/
│           ├── roleSwitcher.js
│           ├── studentDashboard.js
│           ├── findTiffin.js
│           ├── vendorDetails.js
│           ├── mySubscription.js
│           ├── todayMeal.js
│           ├── studentRatings.js
│           ├── studentComplaints.js
│           ├── vendorDashboard.js
│           ├── vendorMealPlans.js
│           ├── vendorMenu.js
│           ├── vendorSubscribers.js
│           ├── vendorDeliveries.js
│           ├── vendorRatings.js
│           ├── vendorComplaints.js
│           ├── agentDashboard.js
│           ├── agentDeliveries.js
│           ├── agentHistory.js
│           ├── adminDashboard.js
│           ├── adminVendors.js
│           ├── adminCustomers.js
│           ├── adminComplaints.js
│           ├── adminRatings.js
│           └── dbmsDemo.js
│
├── package.json
└── README.md
```

---

## How to Install

```bash
cd TiffinTrack
npm install
```

## How to Run

```bash
node server/server.js
```

Then open: **http://localhost:3000**

---

## Demo Roles

| Role           | Demo Account               |
|----------------|---------------------------|
| Student        | Rahul Sharma, Sunrise PG, Room 204 |
| Vendor         | Annapurna Tiffin Services |
| Delivery Agent | Amit Kumar                |
| Admin          | TiffinTrack Administrator |

---

## API Endpoints

| Method | Endpoint                          | Purpose                          |
|--------|-----------------------------------|----------------------------------|
| GET    | /api/vendors                      | All vendors with stats           |
| GET    | /api/vendors/:id                  | Single vendor full details       |
| GET    | /api/customer                     | Demo student (Rahul)             |
| GET    | /api/subscription                 | Current active subscription      |
| POST   | /api/subscription                 | Subscribe (see guard below)      |
| DELETE | /api/subscription                 | Cancel subscription              |
| POST   | /api/rating                       | Submit rating                    |
| POST   | /api/complaint                    | Submit complaint                 |
| GET    | /api/complaints                   | Student's complaint history      |
| GET    | /api/deliveries?role=             | Deliveries (student/agent/vendor)|
| PATCH  | /api/delivery/:id                 | Update delivery status           |
| GET    | /api/admin                        | Admin aggregated data            |
| GET    | /api/vendor                       | Vendor dashboard data            |
| GET    | /api/vendor/:id/menu              | Today's menu for vendor          |
| POST   | /api/vendor/:id/menu              | Add menu item                    |
| PATCH  | /api/vendor/:id/menu/:itemId      | Edit menu item                   |
| DELETE | /api/vendor/:id/menu/:itemId      | Delete menu item                 |
| PATCH  | /api/vendor/:id/menu/publish      | Publish today's menu             |
| GET    | /api/vendor/:id/meal-plans        | Meal plans for vendor            |
| GET    | /api/ratings                      | Vendor ratings                   |

---

## Duplicate Subscription Guard

`POST /api/subscription` checks if the demo student already has an **active** subscription.

If yes, it returns **HTTP 409** with:
```json
{ "error": "Cancel current plan first" }
```

No subscription is created. No wallet is deducted. No payment record is created.  
The student must first cancel their active plan before subscribing to a new one.

---

## Mock Data Architecture

```
mockData.js (server-side, in-memory)
    ↑
    Loaded once when server starts
    ↑
Mutations (POST/PATCH/DELETE) update arrays directly
    ↑
Every GET re-reads the current in-memory state
    ↑
Cross-role updates work because all roles read from the same source
```

**When MySQL is integrated:**  
Only `server/routes/api.js` and `server/data/mockData.js` change.  
All field names use `snake_case` (`customer_id`, `vendor_id`, `plan_id`, etc.)  
to match the planned MySQL schema — so the UI does not need to change.

---

## Cross-Role Data Flow

| Action | Reflects in |
|--------|-------------|
| Student rates vendor | Vendor dashboard rating updates |
| Student submits complaint | Vendor complaints page updates |
| Student subscribes | Student dashboard shows Active |
| Student cancels | Student dashboard shows Cancelled |
| Agent marks delivered | Student Today's Meal status updates |
| Vendor publishes menu | Student Today's Meal shows updated menu |
| Any action | Admin dashboard reflects updated counts |

---

## DBMS Concepts Demonstrated

| Concept     | Location                    | What it shows                                      |
|-------------|-----------------------------|----------------------------------------------------|
| JOIN        | DBMS Demo → Section 1       | Customer + Subscription + MealPlan + Vendor + Delivery |
| GROUP BY    | DBMS Demo → Section 2       | AVG rating per vendor                              |
| VIEW        | DBMS Demo → Section 3       | top_rated_vendors virtual table                    |
| TRANSACTION | DBMS Demo → Section 4       | BEGIN / COMMIT / ROLLBACK with wallet simulation   |

---

## Known Limitations (Preview V1)

- No real MySQL — all data resets when the server restarts
- Demo accounts are hardcoded (Rahul = Student, Annapurna = Vendor, Amit = Agent)
- No real authentication — role selection is a simplified demo mechanism
- Vendor menu publish endpoint path conflicts with item ID — fixed by route ordering

---

## Recommended Phase 2 Plan

1. **MySQL Integration** — Migrate mock data to a real MySQL schema
2. **TRIGGER Implementation** — e.g., auto-update average rating on new Rating insert
3. **Stored Procedures** — e.g., `create_subscription()` stored procedure
4. **Full 12-table Schema** — Include Payment, Notification, Agent table, etc.
5. **ER Diagram** — Full entity-relationship diagram
6. **Normalization** — Show 1NF → 2NF → 3NF progression
7. **Advanced SQL** — Subqueries, HAVING clause, complex JOINs
8. **Authentication** — Session-based login
9. **Smart Features** — Menu voting, meal skip, group discount
