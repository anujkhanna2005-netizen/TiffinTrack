// ============================================================
// TiffinTrack - Mock Data (Single Source of Truth)
// server/data/mockData.js
//
// This file replaces a MySQL database for Preview V1.
// All field names use snake_case to match planned MySQL schema.
// When MySQL is integrated, only the API layer changes — not the UI.
// ============================================================

// ---- VENDORS -----------------------------------------------
const vendors = [
  {
    vendor_id: 'V001',
    name: 'Annapurna Tiffin Services',
    locality: 'Koramangala',
    city: 'Bengaluru',
    contact: '9845012345',
    email: 'annapurna@tiffin.com',
    cuisine: 'North Indian',
    description: 'Authentic home-style North Indian meals delivered fresh daily.',
    is_active: true,
    joined_date: '2023-06-01'
  },
  {
    vendor_id: 'V002',
    name: 'HomeTaste Kitchen',
    locality: 'HSR Layout',
    city: 'Bengaluru',
    contact: '9876543210',
    email: 'hometaste@tiffin.com',
    cuisine: 'South Indian',
    description: 'Traditional South Indian meals — sambar, rasam, rice and more.',
    is_active: true,
    joined_date: '2023-07-15'
  },
  {
    vendor_id: 'V003',
    name: "Maa's Kitchen",
    locality: 'Indiranagar',
    city: 'Bengaluru',
    contact: '9765432109',
    email: 'maaskitchen@tiffin.com',
    cuisine: 'Multi-Cuisine',
    description: 'Rotating weekly menu — the taste of home, every single day.',
    is_active: true,
    joined_date: '2023-08-01'
  },
  {
    vendor_id: 'V004',
    name: 'HealthyBite Tiffins',
    locality: 'BTM Layout',
    city: 'Bengaluru',
    contact: '9654321098',
    email: 'healthybite@tiffin.com',
    cuisine: 'Healthy / Vegan',
    description: 'Calorie-counted, nutritionist-approved meals for health-conscious students.',
    is_active: true,
    joined_date: '2023-09-10'
  },
  {
    vendor_id: 'V005',
    name: 'Campus Meals',
    locality: 'Marathahalli',
    city: 'Bengaluru',
    contact: '9543210987',
    email: 'campusmeals@tiffin.com',
    cuisine: 'Mixed',
    description: 'Budget-friendly meals designed specifically for college students.',
    is_active: true,
    joined_date: '2023-10-05'
  }
];

// ---- MEAL PLANS --------------------------------------------
const meal_plans = [
  // Annapurna
  { plan_id: 'MP001', vendor_id: 'V001', name: 'Monthly Veg Plan',    price: 2400, meals_per_day: 2, veg: true,  description: 'Lunch + Dinner, Mon–Sat' },
  { plan_id: 'MP002', vendor_id: 'V001', name: 'Monthly Non-Veg Plan',price: 2800, meals_per_day: 2, veg: false, description: 'Lunch + Dinner with egg/chicken 3x/week' },
  { plan_id: 'MP003', vendor_id: 'V001', name: 'Lunch Only Plan',     price: 1400, meals_per_day: 1, veg: true,  description: 'Lunch only, Mon–Sat' },
  // HomeTaste
  { plan_id: 'MP004', vendor_id: 'V002', name: 'South Indian Monthly',price: 2200, meals_per_day: 2, veg: true,  description: 'Idli/Dosa breakfast + Rice-based lunch' },
  { plan_id: 'MP005', vendor_id: 'V002', name: 'Tiffin Lite Plan',    price: 1600, meals_per_day: 1, veg: true,  description: 'Dinner only, Mon–Sun' },
  // Maa's Kitchen
  { plan_id: 'MP006', vendor_id: 'V003', name: 'Full Day Plan',       price: 3200, meals_per_day: 3, veg: false, description: 'Breakfast + Lunch + Dinner, all 7 days' },
  { plan_id: 'MP007', vendor_id: 'V003', name: 'Monthly Veg Special', price: 2600, meals_per_day: 2, veg: true,  description: 'Lunch + Dinner, Mon–Sun' },
  // HealthyBite
  { plan_id: 'MP008', vendor_id: 'V004', name: 'Health Monthly Plan', price: 3000, meals_per_day: 2, veg: true,  description: 'Low-calorie lunch + dinner with salads' },
  { plan_id: 'MP009', vendor_id: 'V004', name: 'Salad & Wrap Plan',   price: 2000, meals_per_day: 1, veg: true,  description: 'Light lunch only, Mon–Fri' },
  // Campus Meals
  { plan_id: 'MP010', vendor_id: 'V005', name: 'Budget Monthly Plan', price: 1800, meals_per_day: 2, veg: true,  description: 'Lunch + Dinner, Mon–Sat — best value' },
  { plan_id: 'MP011', vendor_id: 'V005', name: 'Weekend Special',     price: 600,  meals_per_day: 2, veg: false, description: 'Sat + Sun lunch and dinner only' }
];

// ---- CUSTOMERS (STUDENTS) ----------------------------------
const customers = [
  { customer_id: 'C001', name: 'Rahul Sharma',   residence: 'Sunrise PG',         room: '204', phone: '9800011001', wallet: 5000, joined_date: '2024-01-10' },
  { customer_id: 'C002', name: 'Priya Verma',    residence: 'Green View Residency',room: '101', phone: '9800011002', wallet: 4500, joined_date: '2024-01-12' },
  { customer_id: 'C003', name: 'Arjun Mehta',    residence: 'Royal Homes',         room: '305', phone: '9800011003', wallet: 3200, joined_date: '2024-01-15' },
  { customer_id: 'C004', name: 'Sneha Patel',    residence: 'Shiv Residency',      room: '202', phone: '9800011004', wallet: 6000, joined_date: '2024-01-18' },
  { customer_id: 'C005', name: 'Rohit Singh',    residence: 'Sunrise PG',         room: '110', phone: '9800011005', wallet: 2800, joined_date: '2024-02-01' },
  { customer_id: 'C006', name: 'Aditi Sharma',   residence: 'Green View Residency',room: '207', phone: '9800011006', wallet: 5500, joined_date: '2024-02-05' },
  { customer_id: 'C007', name: 'Karan Malhotra', residence: 'Royal Homes',         room: '408', phone: '9800011007', wallet: 3800, joined_date: '2024-02-10' },
  { customer_id: 'C008', name: 'Neha Gupta',     residence: 'Shiv Residency',      room: '315', phone: '9800011008', wallet: 4200, joined_date: '2024-02-14' },
  { customer_id: 'C009', name: 'Yash Jain',      residence: 'Sunrise PG',         room: '306', phone: '9800011009', wallet: 3600, joined_date: '2024-03-01' },
  { customer_id: 'C010', name: 'Simran Kaur',    residence: 'Green View Residency',room: '112', phone: '9800011010', wallet: 4800, joined_date: '2024-03-05' },
  { customer_id: 'C011', name: 'Vivek Mishra',   residence: 'Royal Homes',         room: '209', phone: '9800011011', wallet: 3100, joined_date: '2024-03-10' },
  { customer_id: 'C012', name: 'Riya Agarwal',   residence: 'Shiv Residency',      room: '401', phone: '9800011012', wallet: 5200, joined_date: '2024-03-15' }
];

// ---- DELIVERY AGENTS ---------------------------------------
const agents = [
  { agent_id: 'A001', name: 'Amit Kumar',  phone: '9700001001', zone: 'Koramangala / HSR Layout',  is_active: true },
  { agent_id: 'A002', name: 'Suresh Yadav',phone: '9700001002', zone: 'Indiranagar / Marathahalli', is_active: true },
  { agent_id: 'A003', name: 'Ramesh Nair', phone: '9700001003', zone: 'BTM Layout / Koramangala',   is_active: true }
];

// ---- SUBSCRIPTIONS -----------------------------------------
// status: 'active' | 'cancelled' | 'expired'
const subscriptions = [
  { sub_id: 'S001', customer_id: 'C001', plan_id: 'MP001', vendor_id: 'V001', start_date: '2024-09-01', end_date: '2024-09-30', status: 'active',    auto_renew: true,  payment_id: 'PAY001' },
  { sub_id: 'S002', customer_id: 'C002', plan_id: 'MP004', vendor_id: 'V002', start_date: '2024-09-01', end_date: '2024-09-30', status: 'active',    auto_renew: false, payment_id: 'PAY002' },
  { sub_id: 'S003', customer_id: 'C003', plan_id: 'MP006', vendor_id: 'V003', start_date: '2024-09-01', end_date: '2024-09-30', status: 'active',    auto_renew: true,  payment_id: 'PAY003' },
  { sub_id: 'S004', customer_id: 'C004', plan_id: 'MP008', vendor_id: 'V004', start_date: '2024-09-01', end_date: '2024-09-30', status: 'active',    auto_renew: true,  payment_id: 'PAY004' },
  { sub_id: 'S005', customer_id: 'C005', plan_id: 'MP010', vendor_id: 'V005', start_date: '2024-09-01', end_date: '2024-09-30', status: 'active',    auto_renew: false, payment_id: 'PAY005' },
  { sub_id: 'S006', customer_id: 'C006', plan_id: 'MP002', vendor_id: 'V001', start_date: '2024-09-01', end_date: '2024-09-30', status: 'active',    auto_renew: true,  payment_id: 'PAY006' },
  { sub_id: 'S007', customer_id: 'C007', plan_id: 'MP007', vendor_id: 'V003', start_date: '2024-09-01', end_date: '2024-09-30', status: 'active',    auto_renew: false, payment_id: 'PAY007' },
  { sub_id: 'S008', customer_id: 'C008', plan_id: 'MP005', vendor_id: 'V002', start_date: '2024-08-01', end_date: '2024-08-31', status: 'cancelled', auto_renew: false, payment_id: 'PAY008' },
  { sub_id: 'S009', customer_id: 'C009', plan_id: 'MP003', vendor_id: 'V001', start_date: '2024-09-01', end_date: '2024-09-30', status: 'active',    auto_renew: true,  payment_id: 'PAY009' },
  { sub_id: 'S010', customer_id: 'C010', plan_id: 'MP009', vendor_id: 'V004', start_date: '2024-09-01', end_date: '2024-09-30', status: 'active',    auto_renew: false, payment_id: 'PAY010' },
  { sub_id: 'S011', customer_id: 'C011', plan_id: 'MP010', vendor_id: 'V005', start_date: '2024-09-01', end_date: '2024-09-30', status: 'active',    auto_renew: true,  payment_id: 'PAY011' },
  { sub_id: 'S012', customer_id: 'C012', plan_id: 'MP001', vendor_id: 'V001', start_date: '2024-09-01', end_date: '2024-09-30', status: 'active',    auto_renew: false, payment_id: 'PAY012' }
];

// ---- PAYMENTS ----------------------------------------------
const payments = [
  { payment_id: 'PAY001', customer_id: 'C001', sub_id: 'S001', amount: 2400, payment_date: '2024-09-01', status: 'success' },
  { payment_id: 'PAY002', customer_id: 'C002', sub_id: 'S002', amount: 2200, payment_date: '2024-09-01', status: 'success' },
  { payment_id: 'PAY003', customer_id: 'C003', sub_id: 'S003', amount: 3200, payment_date: '2024-09-01', status: 'success' },
  { payment_id: 'PAY004', customer_id: 'C004', sub_id: 'S004', amount: 3000, payment_date: '2024-09-01', status: 'success' },
  { payment_id: 'PAY005', customer_id: 'C005', sub_id: 'S005', amount: 1800, payment_date: '2024-09-01', status: 'success' },
  { payment_id: 'PAY006', customer_id: 'C006', sub_id: 'S006', amount: 2800, payment_date: '2024-09-01', status: 'success' },
  { payment_id: 'PAY007', customer_id: 'C007', sub_id: 'S007', amount: 2600, payment_date: '2024-09-01', status: 'success' },
  { payment_id: 'PAY008', customer_id: 'C008', sub_id: 'S008', amount: 1600, payment_date: '2024-08-01', status: 'success' },
  { payment_id: 'PAY009', customer_id: 'C009', sub_id: 'S009', amount: 1400, payment_date: '2024-09-01', status: 'success' },
  { payment_id: 'PAY010', customer_id: 'C010', sub_id: 'S010', amount: 2000, payment_date: '2024-09-01', status: 'success' },
  { payment_id: 'PAY011', customer_id: 'C011', sub_id: 'S011', amount: 1800, payment_date: '2024-09-01', status: 'success' },
  { payment_id: 'PAY012', customer_id: 'C012', sub_id: 'S012', amount: 2400, payment_date: '2024-09-01', status: 'success' }
];

// ---- TODAY'S DELIVERIES ------------------------------------
// status: 'pending' | 'out_for_delivery' | 'delivered'
const deliveries = [
  { delivery_id: 'D001', sub_id: 'S001', customer_id: 'C001', vendor_id: 'V001', agent_id: 'A001', delivery_date: '2024-09-14', meal_type: 'Lunch', status: 'out_for_delivery' },
  { delivery_id: 'D002', sub_id: 'S002', customer_id: 'C002', vendor_id: 'V002', agent_id: 'A001', delivery_date: '2024-09-14', meal_type: 'Lunch', status: 'delivered' },
  { delivery_id: 'D003', sub_id: 'S003', customer_id: 'C003', vendor_id: 'V003', agent_id: 'A002', delivery_date: '2024-09-14', meal_type: 'Lunch', status: 'pending' },
  { delivery_id: 'D004', sub_id: 'S004', customer_id: 'C004', vendor_id: 'V004', agent_id: 'A003', delivery_date: '2024-09-14', meal_type: 'Lunch', status: 'pending' },
  { delivery_id: 'D005', sub_id: 'S005', customer_id: 'C005', vendor_id: 'V005', agent_id: 'A001', delivery_date: '2024-09-14', meal_type: 'Lunch', status: 'delivered' },
  { delivery_id: 'D006', sub_id: 'S006', customer_id: 'C006', vendor_id: 'V001', agent_id: 'A001', delivery_date: '2024-09-14', meal_type: 'Lunch', status: 'out_for_delivery' },
  { delivery_id: 'D007', sub_id: 'S007', customer_id: 'C007', vendor_id: 'V003', agent_id: 'A002', delivery_date: '2024-09-14', meal_type: 'Lunch', status: 'pending' },
  { delivery_id: 'D008', sub_id: 'S009', customer_id: 'C009', vendor_id: 'V001', agent_id: 'A001', delivery_date: '2024-09-14', meal_type: 'Lunch', status: 'pending' },
  { delivery_id: 'D009', sub_id: 'S010', customer_id: 'C010', vendor_id: 'V004', agent_id: 'A003', delivery_date: '2024-09-14', meal_type: 'Lunch', status: 'delivered' },
  { delivery_id: 'D010', sub_id: 'S011', customer_id: 'C011', vendor_id: 'V005', agent_id: 'A002', delivery_date: '2024-09-14', meal_type: 'Lunch', status: 'out_for_delivery' },
  { delivery_id: 'D011', sub_id: 'S012', customer_id: 'C012', vendor_id: 'V001', agent_id: 'A001', delivery_date: '2024-09-14', meal_type: 'Lunch', status: 'pending' },
  // Dinner deliveries
  { delivery_id: 'D012', sub_id: 'S001', customer_id: 'C001', vendor_id: 'V001', agent_id: 'A001', delivery_date: '2024-09-14', meal_type: 'Dinner', status: 'pending' },
  { delivery_id: 'D013', sub_id: 'S002', customer_id: 'C002', vendor_id: 'V002', agent_id: 'A001', delivery_date: '2024-09-14', meal_type: 'Dinner', status: 'pending' }
];

// ---- RATINGS -----------------------------------------------
const ratings = [
  { rating_id: 'R001', customer_id: 'C002', vendor_id: 'V001', taste_score: 4, hygiene_score: 5, punctuality_score: 4, value_score: 4, review: 'Really good food, very consistent quality!', created_at: '2024-09-10' },
  { rating_id: 'R002', customer_id: 'C003', vendor_id: 'V001', taste_score: 5, hygiene_score: 4, punctuality_score: 5, value_score: 4, review: 'Annapurna is the best! Dal makhani is amazing.', created_at: '2024-09-11' },
  { rating_id: 'R003', customer_id: 'C006', vendor_id: 'V001', taste_score: 4, hygiene_score: 4, punctuality_score: 3, value_score: 5, review: 'Good value for money. Sometimes a bit late.', created_at: '2024-09-12' },
  { rating_id: 'R004', customer_id: 'C008', vendor_id: 'V002', taste_score: 5, hygiene_score: 5, punctuality_score: 5, value_score: 4, review: 'South Indian food is authentic and delicious!', created_at: '2024-09-09' },
  { rating_id: 'R005', customer_id: 'C007', vendor_id: 'V002', taste_score: 4, hygiene_score: 5, punctuality_score: 4, value_score: 5, review: 'Very clean packaging, on time delivery.', created_at: '2024-09-10' },
  { rating_id: 'R006', customer_id: 'C004', vendor_id: 'V003', taste_score: 5, hygiene_score: 4, punctuality_score: 4, value_score: 4, review: "Tastes like home. Maa's kitchen is wonderful.", created_at: '2024-09-08' },
  { rating_id: 'R007', customer_id: 'C011', vendor_id: 'V003', taste_score: 4, hygiene_score: 5, punctuality_score: 5, value_score: 3, review: 'Slightly expensive but very good quality.', created_at: '2024-09-11' },
  { rating_id: 'R008', customer_id: 'C010', vendor_id: 'V004', taste_score: 4, hygiene_score: 5, punctuality_score: 4, value_score: 3, review: 'Healthy options, great for diet-conscious people.', created_at: '2024-09-07' },
  { rating_id: 'R009', customer_id: 'C012', vendor_id: 'V004', taste_score: 3, hygiene_score: 5, punctuality_score: 4, value_score: 3, review: 'A bit bland but very clean. Good for health goals.', created_at: '2024-09-09' },
  { rating_id: 'R010', customer_id: 'C005', vendor_id: 'V005', taste_score: 4, hygiene_score: 3, punctuality_score: 3, value_score: 5, review: 'Best value in the area! Fills you up.', created_at: '2024-09-10' },
  { rating_id: 'R011', customer_id: 'C009', vendor_id: 'V005', taste_score: 3, hygiene_score: 4, punctuality_score: 4, value_score: 5, review: 'Affordable and decent taste. Does the job.', created_at: '2024-09-12' }
];

// ---- COMPLAINTS --------------------------------------------
// status: 'pending' | 'in_progress' | 'resolved'
const complaints = [
  { complaint_id: 'CMP-1001', customer_id: 'C002', vendor_id: 'V001', issue_type: 'Late Delivery',  description: 'Food arrived 45 minutes late today.', status: 'resolved',    created_at: '2024-09-08' },
  { complaint_id: 'CMP-1002', customer_id: 'C005', vendor_id: 'V005', issue_type: 'Missing Item',   description: 'The dal was missing from today\'s lunch box.', status: 'in_progress', created_at: '2024-09-10' },
  { complaint_id: 'CMP-1003', customer_id: 'C008', vendor_id: 'V002', issue_type: 'Wrong Meal',     description: 'Received non-veg meal instead of veg.', status: 'pending',    created_at: '2024-09-11' },
  { complaint_id: 'CMP-1004', customer_id: 'C010', vendor_id: 'V004', issue_type: 'Poor Taste',     description: 'The food was under-seasoned and cold.', status: 'pending',    created_at: '2024-09-12' },
  { complaint_id: 'CMP-1005', customer_id: 'C007', vendor_id: 'V003', issue_type: 'Food Quality',   description: 'Rice appeared partially uncooked.', status: 'pending',    created_at: '2024-09-13' },
  { complaint_id: 'CMP-1006', customer_id: 'C009', vendor_id: 'V001', issue_type: 'Late Delivery',  description: 'Dinner delivery was 30 minutes late.', status: 'pending',    created_at: '2024-09-13' }
];

// ---- TODAY'S MENU (per vendor) ----------------------------
// menu items for today
const todays_menu = {
  V001: {
    vendor_id: 'V001',
    date: '2024-09-14',
    published: true,
    items: [
      { item_id: 'MI001', name: 'Dal Makhani',       category: 'Main',    quantity: '200ml' },
      { item_id: 'MI002', name: 'Jeera Rice',         category: 'Main',    quantity: '300g'  },
      { item_id: 'MI003', name: 'Butter Roti (3)',    category: 'Bread',   quantity: '3 pcs' },
      { item_id: 'MI004', name: 'Paneer Bhurji',      category: 'Main',    quantity: '150g'  },
      { item_id: 'MI005', name: 'Cucumber Salad',     category: 'Salad',   quantity: '100g'  },
      { item_id: 'MI006', name: 'Raita',              category: 'Side',    quantity: '100ml' }
    ]
  },
  V002: {
    vendor_id: 'V002',
    date: '2024-09-14',
    published: true,
    items: [
      { item_id: 'MI007', name: 'Sambar Rice',        category: 'Main',    quantity: '400g'  },
      { item_id: 'MI008', name: 'Rasam',              category: 'Soup',    quantity: '150ml' },
      { item_id: 'MI009', name: 'Papad',              category: 'Side',    quantity: '2 pcs' },
      { item_id: 'MI010', name: 'Potato Fry',         category: 'Main',    quantity: '150g'  },
      { item_id: 'MI011', name: 'Curd',               category: 'Side',    quantity: '100ml' }
    ]
  },
  V003: {
    vendor_id: 'V003',
    date: '2024-09-14',
    published: true,
    items: [
      { item_id: 'MI012', name: 'Rajma Chawal',       category: 'Main',    quantity: '400g'  },
      { item_id: 'MI013', name: 'Chapati (4)',         category: 'Bread',   quantity: '4 pcs' },
      { item_id: 'MI014', name: 'Mixed Veg Sabzi',    category: 'Main',    quantity: '200g'  },
      { item_id: 'MI015', name: 'Dahi',               category: 'Side',    quantity: '100ml' },
      { item_id: 'MI016', name: 'Pickle',             category: 'Side',    quantity: '20g'   }
    ]
  },
  V004: {
    vendor_id: 'V004',
    date: '2024-09-14',
    published: true,
    items: [
      { item_id: 'MI017', name: 'Quinoa Bowl',        category: 'Main',    quantity: '300g'  },
      { item_id: 'MI018', name: 'Grilled Veggies',    category: 'Side',    quantity: '150g'  },
      { item_id: 'MI019', name: 'Sprouts Salad',      category: 'Salad',   quantity: '100g'  },
      { item_id: 'MI020', name: 'Multigrain Roti (2)',category: 'Bread',   quantity: '2 pcs' },
      { item_id: 'MI021', name: 'Buttermilk',         category: 'Drink',   quantity: '200ml' }
    ]
  },
  V005: {
    vendor_id: 'V005',
    date: '2024-09-14',
    published: true,
    items: [
      { item_id: 'MI022', name: 'Dal Tadka',          category: 'Main',    quantity: '200ml' },
      { item_id: 'MI023', name: 'Steamed Rice',        category: 'Main',    quantity: '300g'  },
      { item_id: 'MI024', name: 'Roti (3)',            category: 'Bread',   quantity: '3 pcs' },
      { item_id: 'MI025', name: 'Aloo Sabzi',         category: 'Main',    quantity: '150g'  },
      { item_id: 'MI026', name: 'Salad',              category: 'Salad',   quantity: '80g'   }
    ]
  }
};

// ---- COUNTER for auto-increment IDs -----------------------
let nextSubId     = 13;   // next subscription number
let nextRatingId  = 12;   // next rating number
let nextComplaintNum = 1007; // next complaint number
let nextPaymentId = 13;   // next payment number
let nextMenuItemId = 27;  // next menu item number

// ---- HELPER: get unique IDs --------------------------------
function getNextSubId()      { return 'S' + String(nextSubId++).padStart(3, '0'); }
function getNextRatingId()   { return 'R' + String(nextRatingId++).padStart(3, '0'); }
function getNextComplaintId(){ return 'CMP-' + nextComplaintNum++; }
function getNextPaymentId()  { return 'PAY' + String(nextPaymentId++).padStart(3, '0'); }
function getNextMenuItemId() { return 'MI' + String(nextMenuItemId++).padStart(3, '0'); }

// ---- COMPUTED HELPERS (called from routes) ----------------

// Calculate overall rating score for a vendor
// Formula: 0.35*taste + 0.25*hygiene + 0.25*punctuality + 0.15*value
function calcVendorRating(vendor_id) {
  const vendorRatings = ratings.filter(r => r.vendor_id === vendor_id);
  if (vendorRatings.length === 0) return null;
  const avg = vendorRatings.reduce((acc, r) => {
    return acc + (0.35 * r.taste_score + 0.25 * r.hygiene_score + 0.25 * r.punctuality_score + 0.15 * r.value_score);
  }, 0) / vendorRatings.length;
  return Math.round(avg * 10) / 10;
}

// Get active subscriber count for a vendor
function countActiveSubscribers(vendor_id) {
  return subscriptions.filter(s => s.vendor_id === vendor_id && s.status === 'active').length;
}

// Get pending complaint count for a vendor
function countPendingComplaints(vendor_id) {
  return complaints.filter(c => c.vendor_id === vendor_id && c.status === 'pending').length;
}

// Get today's delivery count for a vendor
function countTodayDeliveries(vendor_id) {
  return deliveries.filter(d => d.vendor_id === vendor_id).length;
}

module.exports = {
  vendors,
  meal_plans,
  customers,
  agents,
  subscriptions,
  payments,
  deliveries,
  ratings,
  complaints,
  todays_menu,
  // ID generators
  getNextSubId,
  getNextRatingId,
  getNextComplaintId,
  getNextPaymentId,
  getNextMenuItemId,
  // Computed helpers
  calcVendorRating,
  countActiveSubscribers,
  countPendingComplaints,
  countTodayDeliveries
};
