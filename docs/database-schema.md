# Champions Club Management System - Canonical Database Architecture

**Role:** MEMBER 3 (Canonical Database Owner)  
**Database Engine:** PostgreSQL 14+ (Verified on PostgreSQL 18)  
**Schema Version:** 1.0.0 (Canonical Contract)

---

## 1. Architecture Overview & Guarantees

The database layer serves as the single source of truth for the entire Champions Club platform. It unifies all operational, commerce, CRM, and member management domains under strict PostgreSQL relational constraints.

### Core Integrity Guarantees
1. **Concurrency-Safe Court Reservations:**
   - Guaranteed via the PostgreSQL `btree_gist` extension and an exclusion constraint:
     ```sql
     CONSTRAINT no_overlapping_court_bookings EXCLUDE USING gist (
         court_id WITH =,
         tstzrange(start_time, end_time) WITH &&
     ) WHERE (status NOT IN ('cancelled', 'no_show'));
     ```
   - Prevents double-booking race conditions at the database engine level.
2. **ACID Transaction Boundaries:**
   - Critical operations (membership subscription transitions, court reservation creation, bar tab settlements) are wrapped in atomic transactions (`BEGIN ... COMMIT / ROLLBACK`).
3. **Audit Trail & Timestamps:**
   - Automatic triggers (`set_updated_at_column`) maintain accurate `updated_at` timestamps across all mutable tables.
4. **Parameterized SQL:**
   - 100% of application queries utilize `$1, $2, ...` query placeholders to prevent SQL injection vulnerabilities.

---

## 2. Entity Domains & Table Breakdown (30 Canonical Tables)

| Domain | Table Name | Primary Key | Description |
|---|---|---|---|
| **Identity & Membership** | `users` | UUID | System accounts, authentication, role access |
| | `members` | VARCHAR(64) | Member profiles, contact info, member numbers |
| | `membership_plans` | VARCHAR(64) | Gold, Silver, Junior tier definitions & benefits |
| | `memberships` | UUID | Active member subscriptions and date ranges |
| **Sports & Courts** | `sports` | VARCHAR(64) | Sports offered (Tennis, Cricket, Padel, etc.) |
| | `courts` | VARCHAR(64) | Facility courts, surfaces, hourly rates |
| | `bookings` | UUID | Court reservations with exclusion constraints |
| | `booking_participants`| UUID | Players associated with each booking |
| | `member_booking_usage`| UUID | Monthly quota and discount usage tracking |
| **Pro Shop & Inventory** | `product_categories` | VARCHAR(64) | Product taxonomy (Rackets, Balls, Shoes, etc.)|
| | `products` | VARCHAR(64) | Pro shop catalog items with pricing and ratings |
| | `inventory` | UUID | Stock on hand, reserved, and reorder levels |
| | `stock_movements` | UUID | Audit trail of inventory receipts and sales |
| | `shop_orders` | UUID | Customer shop orders and totals |
| | `shop_order_items` | UUID | Line items for shop purchases |
| **Bar & Lounge POS** | `bar_tables` | VARCHAR(64) | Tables across Lounge, Courtside, Terrace, VIP |
| | `menu_items` | VARCHAR(64) | Food and beverage menu with prep times & prices |
| | `bar_orders` | VARCHAR(64) | Table tabs, discounts, kitchen status, payment |
| | `bar_order_items` | UUID | Ordered items with modifiers and kitchen status |
| **CRM & Leads** | `leads` | VARCHAR(64) | Inbound membership and trial enquiries |
| | `lead_followups` | UUID | Interaction notes and follow-up schedules |
| | `quotations` | UUID | Formal membership quotes for leads |
| | `trial_bookings` | UUID | Free and trial court sessions for leads |
| **Staff & Operations** | `employees` | VARCHAR(64) | Staff records, roles, PINs, and pay rates |
| | `staff_shifts` | UUID | Rostered shifts and clock in/out times |
| | `leave_requests` | UUID | Staff time-off requests and approvals |
| **Billing & Finance** | `invoices` | UUID | Accounts receivable invoices |
| | `invoice_items` | UUID | Breakdown of charges on invoices |
| | `payments` | UUID | Settlement records and payment methods |
| | `expenses` | UUID | Club operational expenditures |

---

## 3. Shop & Inventory Operations Architecture (MEMBER 4)

### Unified Shelf & Inventory Model
- **Single Shelf Inventory:** In-store counter purchases, online pickup orders, and home deliveries all consume from the exact same `inventory` table (`quantity_on_hand`).
- **Concurrency & Row-Locking:** Concurrency-safe orders use `SELECT ... FOR UPDATE OF inv` within an ACID transaction to prevent overselling or race conditions.
- **Stock Movement Audit Log:** Every intake (`purchase_receipt`), sale (`sale`), adjustment (`adjustment`), or cancellation (`return`) is recorded immutably in `stock_movements`.
- **Low-Stock Visibility:** Filter query `GET /api/inventory/low-stock` identifies items where `quantity_on_hand <= reorder_threshold`.
- **Dynamic Member Discounts:** Backend pricing automatically applies membership tier privileges (e.g. Gold = 20% discount, Silver = 10% discount).

---

## 4. Database Initialization & Testing

### Running Schema & Seed
```bash
# Initialize schema from clean state
npm run db:init

# Insert canonical seed data
npm run db:seed

# Run database integrity, API integration, and shop test suites
npm test
```
