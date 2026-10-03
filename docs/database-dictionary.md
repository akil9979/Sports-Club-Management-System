# Champions Club Management System - Canonical Data Dictionary

**Owner:** MEMBER 3 (Canonical Database Owner)  
**Schema:** `public`  
**Database:** PostgreSQL 14+ / 18

---

### Table: `users`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Unique user account identifier |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Authentication email address |
| `password_hash` | VARCHAR(255) | NOT NULL | Bcrypt hash with salt rounds = 10 |
| `role` | VARCHAR(50) | NOT NULL, CHECK (role IN (...)) | Role: admin, manager, staff, coach, member, guest |
| `first_name` | VARCHAR(100) | NOT NULL | First name |
| `last_name` | VARCHAR(100) | NOT NULL | Last name |
| `phone` | VARCHAR(30) | NULL | Phone number |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true | Account status flag |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Update timestamp |

---

### Table: `members`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(64) | PK | Member code, e.g. `MEM-8801` |
| `user_id` | UUID | FK users(id) ON DELETE SET NULL | Associated user account |
| `member_number` | VARCHAR(50) | UNIQUE, NOT NULL | Unique membership card number |
| `first_name` | VARCHAR(100) | NOT NULL | First name |
| `last_name` | VARCHAR(100) | NOT NULL | Last name |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Primary contact email |
| `phone` | VARCHAR(30) | NOT NULL | Contact phone number |
| `gender` | VARCHAR(20) | CHECK | male, female, other, prefer_not_to_say |
| `date_of_birth` | DATE | NULL | Date of birth |
| `status` | VARCHAR(30) | NOT NULL, DEFAULT 'active' | active, inactive, suspended, expired, pending |

---

### Table: `membership_plans`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(64) | PK | Plan key: `gold`, `silver`, `junior` |
| `name` | VARCHAR(100) | NOT NULL | Display name |
| `tier` | VARCHAR(50) | NOT NULL, CHECK | Gold, Silver, Junior, Platinum, Corporate |
| `price` | NUMERIC(10,2) | NOT NULL, CHECK (price >= 0) | Monthly billing price |
| `annual_price` | NUMERIC(10,2) | NOT NULL, CHECK (annual_price >= 0) | Annual billing price |
| `billing_cycle` | VARCHAR(30) | NOT NULL, DEFAULT 'monthly' | monthly, quarterly, annual |
| `badge` | VARCHAR(50) | NULL | Display badge, e.g. "Premium Access" |
| `popular` | BOOLEAN | NOT NULL, DEFAULT false | Highlight flag on pricing cards |
| `shop_discount_pct` | NUMERIC(5,2) | DEFAULT 0.00 | Pro shop discount percentage (0-100) |
| `bar_discount_pct` | NUMERIC(5,2) | DEFAULT 0.00 | Food & beverage discount percentage (0-100) |
| `court_discount_pct`| NUMERIC(5,2) | DEFAULT 0.00 | Court booking discount percentage (0-100) |
| `advance_booking_days`| INTEGER | DEFAULT 7 | Slot reservation window in days |
| `guest_passes_per_month`| INTEGER| DEFAULT 0 | Free monthly guest passes |
| `features` | JSONB | NOT NULL, DEFAULT '[]'::jsonb | List of perk strings |

---

### Table: `courts`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(64) | PK | Court identifier, e.g. `court-1` |
| `sport_id` | VARCHAR(64) | FK sports(id) ON DELETE RESTRICT | Sport reference |
| `name` | VARCHAR(100) | NOT NULL | Court title |
| `surface` | VARCHAR(100) | NOT NULL | Playing surface description |
| `indoor` | BOOLEAN | NOT NULL, DEFAULT false | Indoor vs outdoor facility |
| `lighting` | VARCHAR(100) | NULL | Floodlight specifications |
| `hourly_rate` | NUMERIC(10,2) | NOT NULL, CHECK (hourly_rate >= 0) | Standard public rate |
| `member_rate` | NUMERIC(10,2) | NOT NULL, CHECK (member_rate >= 0) | Discounted member rate |
| `gold_rate` | NUMERIC(10,2) | NOT NULL, DEFAULT 0.00 | Gold tier rate (complimentary = 0) |
| `max_players` | INTEGER | NOT NULL, DEFAULT 4 | Capacity per match |

---

### Table: `bookings`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Unique booking identifier |
| `booking_number` | VARCHAR(50) | UNIQUE, NOT NULL | Human-readable ref: `BK-YYYY-XXXX` |
| `court_id` | VARCHAR(64) | FK courts(id) ON DELETE RESTRICT | Reserved court |
| `member_id` | VARCHAR(64) | FK members(id) ON DELETE SET NULL | Member reserving (if applicable) |
| `booking_date` | DATE | NOT NULL | Date of play |
| `start_time` | TIMESTAMPTZ | NOT NULL | Match start timestamp |
| `end_time` | TIMESTAMPTZ | NOT NULL | Match end timestamp |
| `booking_type` | VARCHAR(30) | NOT NULL, DEFAULT 'ordinary' | ordinary, trial, tournament, coaching |
| `status` | VARCHAR(30) | NOT NULL, DEFAULT 'confirmed' | confirmed, in_use, completed, cancelled, no_show |
| `rate_applied` | NUMERIC(10,2) | NOT NULL, CHECK (rate_applied >= 0) | Applied hourly rate |
| `total_amount` | NUMERIC(10,2) | NOT NULL, CHECK (total_amount >= 0) | Calculated total |
| `payment_status` | VARCHAR(30) | NOT NULL, DEFAULT 'unpaid' | unpaid, partial, paid, waived |
| *Exclusion Constraint* | GIST | `EXCLUDE USING gist (court_id WITH =, tstzrange(start_time, end_time) WITH &&) WHERE (status NOT IN ('cancelled', 'no_show'))` | PostgreSQL engine-level non-overlapping booking guarantee |

---

### Table: `products`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(64) | PK | Product identifier, e.g. `prod-1` |
| `category_id` | VARCHAR(64) | FK product_categories(id) ON DELETE RESTRICT | Category taxonomy |
| `sport_id` | VARCHAR(64) | FK sports(id) ON DELETE SET NULL | Associated sport |
| `name` | VARCHAR(200) | NOT NULL | Product title |
| `sku` | VARCHAR(50) | UNIQUE | Stock keeping unit |
| `price` | NUMERIC(10,2) | NOT NULL, CHECK (price >= 0) | Retail price |
| `member_price` | NUMERIC(10,2) | NOT NULL, CHECK (member_price >= 0) | Default member price |
| `rating` | NUMERIC(3,2) | DEFAULT 5.0 | Product customer rating (0-5) |
| `badge` | VARCHAR(50) | NULL | Highlight badge, e.g. "Best Seller" |
| `description` | TEXT | NULL | Catalog description |
| `image_url` | TEXT | NULL | Product photo URL |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true | Active catalog item flag |

---

### Table: `inventory`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Inventory record ID |
| `product_id` | VARCHAR(64) | UNIQUE, FK products(id) ON DELETE CASCADE | Product reference |
| `quantity_on_hand` | INTEGER | NOT NULL, DEFAULT 0, CHECK (>= 0) | Current shelf stock count |
| `quantity_reserved`| INTEGER | NOT NULL, DEFAULT 0, CHECK (>= 0) | Allocated / pending pickup stock |
| `reorder_threshold`| INTEGER | NOT NULL, DEFAULT 5, CHECK (>= 0) | Low-stock alert trigger level |
| `reorder_quantity` | INTEGER | NOT NULL, DEFAULT 20, CHECK (>= 0) | Suggested restock intake quantity |

---

### Table: `stock_movements`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Movement audit record ID |
| `product_id` | VARCHAR(64) | FK products(id) ON DELETE RESTRICT | Affected product |
| `movement_type` | VARCHAR(30) | NOT NULL, CHECK | purchase_receipt, sale, adjustment, return, damaged, transfer |
| `quantity` | INTEGER | NOT NULL, CHECK (quantity <> 0) | Quantity delta (+/-) |
| `reference_id` | VARCHAR(100) | NULL | Linked order / batch / adjustment ID |
| `notes` | TEXT | NULL | Reason or context |
| `created_by` | UUID | FK users(id) ON DELETE SET NULL | Staff member performing movement |

---

### Table: `shop_orders`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Order UUID |
| `order_number` | VARCHAR(50) | UNIQUE, NOT NULL | Human-readable ref: `SO-YYYY-XXXX` |
| `member_id` | VARCHAR(64) | FK members(id) ON DELETE SET NULL | Linked member |
| `customer_name` | VARCHAR(100) | NULL | Buyer name |
| `customer_email` | VARCHAR(255) | NULL | Buyer email |
| `customer_phone` | VARCHAR(30) | NULL | Buyer phone |
| `order_type` | VARCHAR(30) | NOT NULL, DEFAULT 'counter' | counter, online_pickup, online_delivery |
| `fulfilment_type` | VARCHAR(30) | NOT NULL, DEFAULT 'in_store' | in_store, pickup, delivery |
| `delivery_address` | TEXT | NULL | Delivery street address |
| `delivery_notes` | TEXT | NULL | Delivery instructions |
| `pickup_time` | TIMESTAMPTZ | NULL | Scheduled pickup timestamp |
| `status` | VARCHAR(30) | NOT NULL, DEFAULT 'pending' | pending, processing, completed, cancelled, refunded |
| `subtotal` | NUMERIC(10,2) | NOT NULL, CHECK (>= 0) | Retail subtotal |
| `discount_amount` | NUMERIC(10,2) | NOT NULL, DEFAULT 0.00 | Member discount savings |
| `tax_amount` | NUMERIC(10,2) | NOT NULL, DEFAULT 0.00 | 5% GST on sports goods |
| `total_amount` | NUMERIC(10,2) | NOT NULL, CHECK (>= 0) | Final billed amount |
| `payment_status` | VARCHAR(30) | NOT NULL, DEFAULT 'unpaid' | unpaid, paid, refunded |

---

### Table: `shop_order_items`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Line item UUID |
| `shop_order_id` | UUID | FK shop_orders(id) ON DELETE CASCADE | Parent order |
| `product_id` | VARCHAR(64) | FK products(id) ON DELETE RESTRICT | Product item |
| `quantity` | INTEGER | NOT NULL, CHECK (quantity > 0) | Quantity purchased |
| `unit_price` | NUMERIC(10,2) | NOT NULL, CHECK (unit_price >= 0) | Price per unit after discount |
| `total_price` | NUMERIC(10,2) | NOT NULL, CHECK (total_price >= 0) | Line total amount |
