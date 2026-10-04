-- ============================================================================
-- CHAMPIONS CLUB MANAGEMENT SYSTEM
-- CANONICAL DATABASE SCHEMA SPECIFICATION
-- Role: MEMBER 3 (Canonical Database Owner)
-- Target: PostgreSQL 14+ (Compatible with PostgreSQL 18)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Clean drop (topological order)
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS staff_shifts CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS trial_bookings CASCADE;
DROP TABLE IF EXISTS quotations CASCADE;
DROP TABLE IF EXISTS lead_followups CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS bar_order_items CASCADE;
DROP TABLE IF EXISTS bar_orders CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS bar_tables CASCADE;
DROP TABLE IF EXISTS shop_order_items CASCADE;
DROP TABLE IF EXISTS shop_orders CASCADE;
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS product_categories CASCADE;
DROP TABLE IF EXISTS member_booking_usage CASCADE;
DROP TABLE IF EXISTS booking_participants CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS courts CASCADE;
DROP TABLE IF EXISTS sports CASCADE;
DROP TABLE IF EXISTS memberships CASCADE;
DROP TABLE IF EXISTS membership_plans CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ----------------------------------------------------------------------------
-- 1. USERS & AUTHENTICATION
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'staff', 'coach', 'member', 'guest')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(30),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ----------------------------------------------------------------------------
-- 2. MEMBERS
-- ----------------------------------------------------------------------------
CREATE TABLE members (
    id VARCHAR(64) PRIMARY KEY, -- e.g. 'MEM-8801' or custom code
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    member_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(30) NOT NULL,
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    date_of_birth DATE,
    address TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(30),
    status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'expired', 'pending')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_members_user_id ON members(user_id);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_email ON members(email);

-- ----------------------------------------------------------------------------
-- 3. MEMBERSHIP PLANS
-- ----------------------------------------------------------------------------
CREATE TABLE membership_plans (
    id VARCHAR(64) PRIMARY KEY, -- e.g. 'gold', 'silver', 'junior'
    name VARCHAR(100) NOT NULL,
    tier VARCHAR(50) NOT NULL CHECK (tier IN ('Gold', 'Silver', 'Junior', 'Platinum', 'Corporate', 'Standard')),
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    annual_price NUMERIC(10, 2) NOT NULL CHECK (annual_price >= 0),
    billing_cycle VARCHAR(30) NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'quarterly', 'annual')),
    badge VARCHAR(50),
    popular BOOLEAN NOT NULL DEFAULT false,
    description TEXT,
    court_privileges TEXT,
    shop_discount_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (shop_discount_pct >= 0 AND shop_discount_pct <= 100),
    bar_discount_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (bar_discount_pct >= 0 AND bar_discount_pct <= 100),
    court_discount_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (court_discount_pct >= 0 AND court_discount_pct <= 100),
    advance_booking_days INTEGER NOT NULL DEFAULT 7 CHECK (advance_booking_days >= 0),
    guest_passes_per_month INTEGER NOT NULL DEFAULT 0 CHECK (guest_passes_per_month >= 0),
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_membership_plans_tier ON membership_plans(tier);
CREATE INDEX idx_membership_plans_is_active ON membership_plans(is_active);

-- ----------------------------------------------------------------------------
-- 4. MEMBERSHIPS (Member Subscription Contract)
-- ----------------------------------------------------------------------------
CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id VARCHAR(64) NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    plan_id VARCHAR(64) NOT NULL REFERENCES membership_plans(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'frozen', 'pending_renewal')),
    auto_renew BOOLEAN NOT NULL DEFAULT true,
    payment_frequency VARCHAR(30) NOT NULL DEFAULT 'monthly' CHECK (payment_frequency IN ('monthly', 'quarterly', 'annual')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_membership_dates CHECK (end_date >= start_date)
);

CREATE INDEX idx_memberships_member_id ON memberships(member_id);
CREATE INDEX idx_memberships_plan_id ON memberships(plan_id);
CREATE INDEX idx_memberships_status ON memberships(status);

-- ----------------------------------------------------------------------------
-- 5. SPORTS
-- ----------------------------------------------------------------------------
CREATE TABLE sports (
    id VARCHAR(64) PRIMARY KEY, -- e.g. 'tennis', 'cricket', 'padel', 'badminton', 'squash'
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 6. COURTS
-- ----------------------------------------------------------------------------
CREATE TABLE courts (
    id VARCHAR(64) PRIMARY KEY, -- e.g. 'court-1', 'court-2'
    sport_id VARCHAR(64) NOT NULL REFERENCES sports(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    surface VARCHAR(100) NOT NULL,
    indoor BOOLEAN NOT NULL DEFAULT false,
    lighting VARCHAR(100),
    hourly_rate NUMERIC(10, 2) NOT NULL CHECK (hourly_rate >= 0),
    member_rate NUMERIC(10, 2) NOT NULL CHECK (member_rate >= 0),
    gold_rate NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (gold_rate >= 0),
    max_players INTEGER NOT NULL DEFAULT 4 CHECK (max_players > 0),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_courts_sport_id ON courts(sport_id);
CREATE INDEX idx_courts_is_active ON courts(is_active);

-- ----------------------------------------------------------------------------
-- 7. BOOKINGS & EXCLUSION INTEGRITY
-- ----------------------------------------------------------------------------
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_number VARCHAR(50) UNIQUE NOT NULL,
    court_id VARCHAR(64) NOT NULL REFERENCES courts(id) ON DELETE RESTRICT,
    member_id VARCHAR(64) REFERENCES members(id) ON DELETE SET NULL,
    guest_name VARCHAR(100),
    guest_email VARCHAR(255),
    guest_phone VARCHAR(30),
    booking_date DATE NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    booking_type VARCHAR(30) NOT NULL DEFAULT 'ordinary' CHECK (booking_type IN ('ordinary', 'trial', 'tournament', 'coaching', 'maintenance', 'social_mixer')),
    status VARCHAR(30) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'in_use', 'completed', 'cancelled', 'no_show')),
    rate_applied NUMERIC(10, 2) NOT NULL CHECK (rate_applied >= 0),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    payment_status VARCHAR(30) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'refunded', 'waived')),
    cancellation_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_booking_times CHECK (end_time > start_time),
    -- Canonical PostgreSQL hard protection against overlapping ordinary bookings
    CONSTRAINT no_overlapping_court_bookings EXCLUDE USING gist (
        court_id WITH =,
        tstzrange(start_time, end_time) WITH &&
    ) WHERE (status NOT IN ('cancelled', 'no_show'))
);

CREATE INDEX idx_bookings_court_id ON bookings(court_id);
CREATE INDEX idx_bookings_member_id ON bookings(member_id);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_start_end ON bookings(start_time, end_time);
CREATE INDEX idx_bookings_status ON bookings(status);

-- ----------------------------------------------------------------------------
-- 8. BOOKING PARTICIPANTS
-- ----------------------------------------------------------------------------
CREATE TABLE booking_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    member_id VARCHAR(64) REFERENCES members(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_booking_participants_booking_id ON booking_participants(booking_id);

-- ----------------------------------------------------------------------------
-- 9. MEMBER BOOKING USAGE
-- ----------------------------------------------------------------------------
CREATE TABLE member_booking_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id VARCHAR(64) NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    period_month VARCHAR(7) NOT NULL, -- Format: 'YYYY-MM'
    hours_used NUMERIC(5, 2) NOT NULL DEFAULT 1.00 CHECK (hours_used > 0),
    guest_passes_used INTEGER NOT NULL DEFAULT 0 CHECK (guest_passes_used >= 0),
    discount_applied NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount_applied >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_member_booking_usage UNIQUE (member_id, booking_id)
);

CREATE INDEX idx_member_booking_usage_period ON member_booking_usage(member_id, period_month);

-- ----------------------------------------------------------------------------
-- 10. PRODUCT CATEGORIES
-- ----------------------------------------------------------------------------
CREATE TABLE product_categories (
    id VARCHAR(64) PRIMARY KEY, -- e.g. 'rackets', 'balls', 'shoes', 'cricket', 'accessories'
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 11. PRODUCTS
-- ----------------------------------------------------------------------------
CREATE TABLE products (
    id VARCHAR(64) PRIMARY KEY, -- e.g. 'prod-1'
    category_id VARCHAR(64) NOT NULL REFERENCES product_categories(id) ON DELETE RESTRICT,
    sport_id VARCHAR(64) REFERENCES sports(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    sku VARCHAR(50) UNIQUE,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    member_price NUMERIC(10, 2) NOT NULL CHECK (member_price >= 0),
    rating NUMERIC(3, 2) DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5.0),
    badge VARCHAR(50),
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_sport_id ON products(sport_id);
CREATE INDEX idx_products_is_active ON products(is_active);

-- ----------------------------------------------------------------------------
-- 12. INVENTORY
-- ----------------------------------------------------------------------------
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id VARCHAR(64) UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity_on_hand INTEGER NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
    quantity_reserved INTEGER NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
    reorder_threshold INTEGER NOT NULL DEFAULT 5 CHECK (reorder_threshold >= 0),
    reorder_quantity INTEGER NOT NULL DEFAULT 20 CHECK (reorder_quantity >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inventory_product_id ON inventory(product_id);

-- ----------------------------------------------------------------------------
-- 13. STOCK MOVEMENTS
-- ----------------------------------------------------------------------------
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    movement_type VARCHAR(30) NOT NULL CHECK (movement_type IN ('purchase_receipt', 'sale', 'adjustment', 'return', 'damaged', 'transfer')),
    quantity INTEGER NOT NULL CHECK (quantity <> 0),
    reference_id VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stock_movements_product_id ON stock_movements(product_id);

-- ----------------------------------------------------------------------------
-- 14. SHOP ORDERS
-- ----------------------------------------------------------------------------
CREATE TABLE shop_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    member_id VARCHAR(64) REFERENCES members(id) ON DELETE SET NULL,
    customer_name VARCHAR(100),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(30),
    order_type VARCHAR(30) NOT NULL DEFAULT 'counter' CHECK (order_type IN ('counter', 'online_pickup', 'online_delivery')),
    fulfilment_type VARCHAR(30) NOT NULL DEFAULT 'in_store' CHECK (fulfilment_type IN ('in_store', 'pickup', 'delivery')),
    delivery_address TEXT,
    delivery_notes TEXT,
    pickup_time TIMESTAMPTZ,
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'refunded')),
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    payment_status VARCHAR(30) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shop_orders_member_id ON shop_orders(member_id);
CREATE INDEX idx_shop_orders_status ON shop_orders(status);
CREATE INDEX idx_shop_orders_order_type ON shop_orders(order_type);

-- ----------------------------------------------------------------------------
-- 15. SHOP ORDER ITEMS
-- ----------------------------------------------------------------------------
CREATE TABLE shop_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_order_id UUID NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
    product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shop_order_items_order_id ON shop_order_items(shop_order_id);

-- ----------------------------------------------------------------------------
-- 16. BAR TABLES
-- ----------------------------------------------------------------------------
CREATE TABLE bar_tables (
    id VARCHAR(64) PRIMARY KEY, -- e.g. 'table-1'
    number INTEGER UNIQUE NOT NULL CHECK (number > 0),
    name VARCHAR(100) NOT NULL,
    section VARCHAR(50) NOT NULL, -- 'Lounge', 'Courtside', 'Terrace', 'Bar Counter', 'VIP Booth'
    capacity INTEGER NOT NULL DEFAULT 4 CHECK (capacity > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'open', 'occupied', 'reserved', 'maintenance')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bar_tables_status ON bar_tables(status);

-- ----------------------------------------------------------------------------
-- 17. MENU ITEMS
-- ----------------------------------------------------------------------------
CREATE TABLE menu_items (
    id VARCHAR(64) PRIMARY KEY, -- e.g. 'bev-1', 'food-1', 'main-1', 'rec-1'
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'Beers & Ciders', 'Signature Cocktails', 'Recovery & Smoothies', 'Bar Bites', 'Mains'
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    member_price NUMERIC(10, 2) NOT NULL CHECK (member_price >= 0),
    description TEXT,
    prep_time_minutes INTEGER NOT NULL DEFAULT 5 CHECK (prep_time_minutes >= 0),
    alcoholic BOOLEAN NOT NULL DEFAULT false,
    badge VARCHAR(50),
    in_stock BOOLEAN NOT NULL DEFAULT true,
    stock INTEGER NOT NULL DEFAULT 50 CHECK (stock >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_menu_items_category ON menu_items(category);

-- ----------------------------------------------------------------------------
-- 18. BAR ORDERS
-- ----------------------------------------------------------------------------
CREATE TABLE bar_orders (
    id VARCHAR(64) PRIMARY KEY, -- e.g. 'ORD-201'
    table_id VARCHAR(64) REFERENCES bar_tables(id) ON DELETE SET NULL,
    member_id VARCHAR(64) REFERENCES members(id) ON DELETE SET NULL,
    guest_name VARCHAR(100),
    membership_tier VARCHAR(50),
    status VARCHAR(30) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'settled', 'voided', 'cancelled')),
    kitchen_status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (kitchen_status IN ('PENDING', 'PREPARING', 'READY', 'SERVED')),
    discount_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    tax NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (tax >= 0),
    total NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (total >= 0),
    payment_method VARCHAR(30) CHECK (payment_method IN ('cash', 'card', 'upi', 'member_tab', 'split')),
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bar_orders_table_id ON bar_orders(table_id);
CREATE INDEX idx_bar_orders_status ON bar_orders(status);
CREATE INDEX idx_bar_orders_kitchen_status ON bar_orders(kitchen_status);

-- ----------------------------------------------------------------------------
-- 19. BAR ORDER ITEMS
-- ----------------------------------------------------------------------------
CREATE TABLE bar_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bar_order_id VARCHAR(64) NOT NULL REFERENCES bar_orders(id) ON DELETE CASCADE,
    item_id VARCHAR(64) NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    notes TEXT,
    kitchen_status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (kitchen_status IN ('PENDING', 'PREPARING', 'READY', 'SERVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bar_order_items_order_id ON bar_order_items(bar_order_id);

-- ----------------------------------------------------------------------------
-- 20. LEADS
-- ----------------------------------------------------------------------------
CREATE TABLE leads (
    id VARCHAR(64) PRIMARY KEY, -- e.g. 'LEAD-XYZ123'
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    sport VARCHAR(100),
    interest_tier VARCHAR(50),
    source VARCHAR(50) DEFAULT 'website',
    status VARCHAR(30) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'trial_booked', 'quoted', 'converted', 'lost')),
    message TEXT,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_email ON leads(email);

-- ----------------------------------------------------------------------------
-- 21. LEAD FOLLOWUPS
-- ----------------------------------------------------------------------------
CREATE TABLE lead_followups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id VARCHAR(64) NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    followup_date TIMESTAMPTZ NOT NULL,
    contact_method VARCHAR(30) NOT NULL CHECK (contact_method IN ('phone', 'email', 'whatsapp', 'in_person')),
    summary TEXT NOT NULL,
    outcome VARCHAR(50),
    next_action_date DATE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lead_followups_lead_id ON lead_followups(lead_id);

-- ----------------------------------------------------------------------------
-- 22. QUOTATIONS
-- ----------------------------------------------------------------------------
CREATE TABLE quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_number VARCHAR(50) UNIQUE NOT NULL,
    lead_id VARCHAR(64) REFERENCES leads(id) ON DELETE SET NULL,
    member_id VARCHAR(64) REFERENCES members(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    plan_id VARCHAR(64) REFERENCES membership_plans(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    valid_until DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
    terms TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quotations_lead_id ON quotations(lead_id);
CREATE INDEX idx_quotations_status ON quotations(status);

-- ----------------------------------------------------------------------------
-- 23. TRIAL BOOKINGS
-- ----------------------------------------------------------------------------
CREATE TABLE trial_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id VARCHAR(64) NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    court_id VARCHAR(64) NOT NULL REFERENCES courts(id) ON DELETE RESTRICT,
    scheduled_time TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
    coach_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'attended', 'no_show', 'cancelled')),
    feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trial_bookings_lead_id ON trial_bookings(lead_id);
CREATE INDEX idx_trial_bookings_court_id ON trial_bookings(court_id);

-- ----------------------------------------------------------------------------
-- 24. STAFF JOB TYPES (Scalable Database-Driven Staff Job Access Control)
-- ----------------------------------------------------------------------------
CREATE TABLE staff_job_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_staff_job_types_code ON staff_job_types(code);
CREATE INDEX idx_staff_job_types_is_active ON staff_job_types(is_active);

-- ----------------------------------------------------------------------------
-- 25. PERMISSIONS (Fine-Grained System Permissions)
-- ----------------------------------------------------------------------------
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,
    module VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_permissions_code ON permissions(code);
CREATE INDEX idx_permissions_module ON permissions(module);

-- ----------------------------------------------------------------------------
-- 26. STAFF JOB TYPE PERMISSIONS (Many-to-Many Permission Mapping)
-- ----------------------------------------------------------------------------
CREATE TABLE staff_job_type_permissions (
    staff_job_type_id UUID NOT NULL REFERENCES staff_job_types(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (staff_job_type_id, permission_id)
);

-- ----------------------------------------------------------------------------
-- 27. EMPLOYEES
-- ----------------------------------------------------------------------------
CREATE TABLE employees (
    id VARCHAR(64) PRIMARY KEY, -- e.g. 'STF-001'
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    employee_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(30) NOT NULL,
    staff_job_type_id UUID REFERENCES staff_job_types(id) ON DELETE RESTRICT,
    department VARCHAR(50),
    designation VARCHAR(100) NOT NULL,
    pin VARCHAR(10),
    hourly_rate NUMERIC(10, 2) DEFAULT 0.00 CHECK (hourly_rate >= 0),
    salary NUMERIC(10, 2) DEFAULT 0.00 CHECK (salary >= 0),
    employment_type VARCHAR(30) NOT NULL DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'intern')),
    status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated', 'on_leave')),
    joined_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_employees_staff_job_type_id ON employees(staff_job_type_id);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_status ON employees(status);

-- ----------------------------------------------------------------------------
-- 25. STAFF SHIFTS
-- ----------------------------------------------------------------------------
CREATE TABLE staff_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id VARCHAR(64) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    shift_date DATE NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    actual_clock_in TIMESTAMPTZ,
    actual_clock_out TIMESTAMPTZ,
    status VARCHAR(30) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'absent', 'late', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_shift_times CHECK (end_time > start_time)
);

CREATE INDEX idx_staff_shifts_employee_id ON staff_shifts(employee_id);
CREATE INDEX idx_staff_shifts_date ON staff_shifts(shift_date);

-- ----------------------------------------------------------------------------
-- 26. LEAVE REQUESTS
-- ----------------------------------------------------------------------------
CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id VARCHAR(64) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type VARCHAR(30) NOT NULL CHECK (leave_type IN ('annual', 'sick', 'casual', 'unpaid', 'emergency')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_leave_dates CHECK (end_date >= start_date)
);

CREATE INDEX idx_leave_requests_employee_id ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);

-- ----------------------------------------------------------------------------
-- 27. INVOICES
-- ----------------------------------------------------------------------------
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    member_id VARCHAR(64) REFERENCES members(id) ON DELETE SET NULL,
    lead_id VARCHAR(64) REFERENCES leads(id) ON DELETE SET NULL,
    recipient_name VARCHAR(150) NOT NULL,
    recipient_email VARCHAR(255),
    invoice_type VARCHAR(30) NOT NULL CHECK (invoice_type IN ('membership', 'booking', 'shop', 'bar', 'quotation', 'general')),
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (paid_amount >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'unpaid' CHECK (status IN ('draft', 'unpaid', 'partially_paid', 'paid', 'void', 'overdue')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoices_member_id ON invoices(member_id);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_status ON invoices(status);

-- ----------------------------------------------------------------------------
-- 28. INVOICE ITEMS
-- ----------------------------------------------------------------------------
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1.00 CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (tax_rate >= 0),
    total_price NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
    reference_type VARCHAR(50), -- 'membership_plan', 'court_booking', 'product', 'menu_item'
    reference_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- ----------------------------------------------------------------------------
-- 29. PAYMENTS
-- ----------------------------------------------------------------------------
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    member_id VARCHAR(64) REFERENCES members(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('cash', 'card', 'upi', 'netbanking', 'wallet', 'cheque')),
    transaction_reference VARCHAR(100),
    status VARCHAR(30) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    paid_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_member_id ON payments(member_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ----------------------------------------------------------------------------
-- 30. EXPENSES
-- ----------------------------------------------------------------------------
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_number VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('maintenance', 'inventory_purchase', 'utilities', 'salaries', 'marketing', 'equipment', 'software', 'misc')),
    title VARCHAR(200) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    expense_date DATE NOT NULL,
    vendor_name VARCHAR(150),
    receipt_url TEXT,
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'upi', 'cheque')),
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_expense_date ON expenses(expense_date);

-- ----------------------------------------------------------------------------
-- AUTOMATIC TIMESTAMP TRIGGER HELPER
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Attach timestamp triggers
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();
CREATE TRIGGER trg_members_updated_at BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();
CREATE TRIGGER trg_membership_plans_updated_at BEFORE UPDATE ON membership_plans FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();
CREATE TRIGGER trg_memberships_updated_at BEFORE UPDATE ON memberships FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();
CREATE TRIGGER trg_sports_updated_at BEFORE UPDATE ON sports FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();
CREATE TRIGGER trg_courts_updated_at BEFORE UPDATE ON courts FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();
CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();
CREATE TRIGGER trg_product_categories_updated_at BEFORE UPDATE ON product_categories FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();
CREATE TRIGGER trg_inventory_updated_at BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();
CREATE TRIGGER trg_shop_orders_updated_at BEFORE UPDATE ON shop_orders FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();
CREATE TRIGGER trg_bar_tables_updated_at BEFORE UPDATE ON bar_tables FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();
CREATE TRIGGER trg_menu_items_updated_at BEFORE UPDATE ON menu_items FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();
CREATE TRIGGER trg_bar_orders_updated_at BEFORE UPDATE ON bar_orders FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();
CREATE TRIGGER trg_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();
CREATE TRIGGER trg_quotations_updated_at BEFORE UPDATE ON quotations FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();
CREATE TRIGGER trg_trial_bookings_updated_at BEFORE UPDATE ON trial_bookings FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();
CREATE TRIGGER trg_staff_job_types_updated_at BEFORE UPDATE ON staff_job_types FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();
CREATE TRIGGER trg_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();
CREATE TRIGGER trg_staff_shifts_updated_at BEFORE UPDATE ON staff_shifts FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();
CREATE TRIGGER trg_leave_requests_updated_at BEFORE UPDATE ON leave_requests FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();
CREATE TRIGGER trg_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();
CREATE TRIGGER trg_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();
