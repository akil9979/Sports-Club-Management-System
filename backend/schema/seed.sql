-- ============================================================================
-- CHAMPIONS CLUB MANAGEMENT SYSTEM
-- CANONICAL DATABASE SEED DATA SPECIFICATION
-- Role: MEMBER 3 (Canonical Database Owner)
-- ============================================================================

-- Password for demo users: "Password@123" (bcrypt hash with salt 10)
-- $2a$10$f5WhRamHTc8GD9U8e9OIVu.HLePosGYKWNxSnNDQVUteuLwUYJRAW
-- PIN for staff: matches staff logins

-- ----------------------------------------------------------------------------
-- 1. USERS
-- ----------------------------------------------------------------------------
INSERT INTO users (id, email, password_hash, role, first_name, last_name, phone, is_active)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'admin@championsclub.com', '$2a$10$f5WhRamHTc8GD9U8e9OIVu.HLePosGYKWNxSnNDQVUteuLwUYJRAW', 'admin', 'Club', 'Administrator', '+919876543200', true),
    ('22222222-2222-2222-2222-222222222221', 'kenil.patel@championsclub.com', '$2a$10$f5WhRamHTc8GD9U8e9OIVu.HLePosGYKWNxSnNDQVUteuLwUYJRAW', 'manager', 'Kenil', 'Patel', '+919876543201', true),
    ('22222222-2222-2222-2222-222222222222', 'priya.nair@championsclub.com', '$2a$10$f5WhRamHTc8GD9U8e9OIVu.HLePosGYKWNxSnNDQVUteuLwUYJRAW', 'staff', 'Priya', 'Nair', '+919876543202', true),
    ('22222222-2222-2222-2222-222222222223', 'arjun.singh@championsclub.com', '$2a$10$f5WhRamHTc8GD9U8e9OIVu.HLePosGYKWNxSnNDQVUteuLwUYJRAW', 'staff', 'Arjun', 'Singh', '+919876543203', true),
    ('22222222-2222-2222-2222-222222222224', 'ananya.roy@championsclub.com', '$2a$10$f5WhRamHTc8GD9U8e9OIVu.HLePosGYKWNxSnNDQVUteuLwUYJRAW', 'staff', 'Ananya', 'Roy', '+919876543204', true),
    ('33333333-3333-3333-3333-333333333331', 'devon.conway@example.com', '$2a$10$f5WhRamHTc8GD9U8e9OIVu.HLePosGYKWNxSnNDQVUteuLwUYJRAW', 'member', 'Devon', 'Conway', '+919876543211', true),
    ('33333333-3333-3333-3333-333333333332', 'sarah.jenkins@example.com', '$2a$10$f5WhRamHTc8GD9U8e9OIVu.HLePosGYKWNxSnNDQVUteuLwUYJRAW', 'member', 'Sarah', 'Jenkins', '+919876543212', true),
    ('33333333-3333-3333-3333-333333333333', 'rajesh.sharma@example.com', '$2a$10$f5WhRamHTc8GD9U8e9OIVu.HLePosGYKWNxSnNDQVUteuLwUYJRAW', 'member', 'Rajesh', 'Sharma', '+919876543213', true),
    ('33333333-3333-3333-3333-333333333334', 'michael.chang@example.com', '$2a$10$f5WhRamHTc8GD9U8e9OIVu.HLePosGYKWNxSnNDQVUteuLwUYJRAW', 'member', 'Michael', 'Chang', '+919876543214', true),
    ('33333333-3333-3333-3333-333333333335', 'marcus.finch@example.com', '$2a$10$f5WhRamHTc8GD9U8e9OIVu.HLePosGYKWNxSnNDQVUteuLwUYJRAW', 'member', 'Marcus', 'Finch', '+919876543215', true)
ON CONFLICT (email) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. MEMBERS
-- ----------------------------------------------------------------------------
INSERT INTO members (id, user_id, member_number, first_name, last_name, email, phone, gender, date_of_birth, status)
VALUES
    ('MEM-8801', '33333333-3333-3333-3333-333333333331', 'CC-2026-8801', 'Devon', 'Conway', 'devon.conway@example.com', '+919876543211', 'male', '1991-07-08', 'active'),
    ('MEM-4920', '33333333-3333-3333-3333-333333333332', 'CC-2026-4920', 'Sarah', 'Jenkins', 'sarah.jenkins@example.com', '+919876543212', 'female', '1995-03-22', 'active'),
    ('MEM-1002', '33333333-3333-3333-3333-333333333333', 'CC-2026-1002', 'Rajesh', 'Sharma', 'rajesh.sharma@example.com', '+919876543213', 'male', '1988-11-14', 'active'),
    ('MEM-3120', '33333333-3333-3333-3333-333333333334', 'CC-2026-3120', 'Michael', 'Chang', 'michael.chang@example.com', '+919876543214', 'male', '1993-02-19', 'active'),
    ('MEM-1092', '33333333-3333-3333-3333-333333333335', 'CC-2026-1092', 'Marcus', 'Finch', 'marcus.finch@example.com', '+919876543215', 'male', '1985-05-15', 'expired')
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. MEMBERSHIP PLANS
-- ----------------------------------------------------------------------------
INSERT INTO membership_plans (id, name, tier, price, annual_price, billing_cycle, badge, popular, description, court_privileges, shop_discount_pct, bar_discount_pct, court_discount_pct, advance_booking_days, guest_passes_per_month, features)
VALUES
    ('gold', 'Gold Championship', 'Gold', 4999.00, 47990.00, 'monthly', 'Premium Access', true,
     'Full, unrestricted club privileges. Free court bookings, VIP lounge access, and exclusive pro shop perks.',
     '100% complimentary standard court hours', 20.00, 15.00, 100.00, 14, 2,
     '["Unlimited court bookings (Tennis, Box Cricket, Padel)", "14-day advance slot reservation window", "2 free monthly guest passes", "Complimentary dedicated locker & fresh towel service", "20% discount on all pro shop gear, shoes & restringing", "15% discount at the sports bar & cafeteria", "Priority access to Friday night social play mixers", "Quarterly 1-on-1 coaching assessment included"]'::jsonb),
    ('silver', 'Silver Standard', 'Silver', 2799.00, 26870.00, 'monthly', 'Most Popular', false,
     'Designed for active recreational players seeking standard peak and off-peak court slots at member rates.',
     '50% discounted court booking rates', 10.00, 10.00, 50.00, 7, 0,
     '["50% discounted court bookings on all sports", "7-day advance slot reservation window", "10% discount on all pro shop equipment", "10% discount at the cafeteria and bar", "Eligibility for intra-club weekend leagues", "Instant mobile cancellation up to 4 hours before play"]'::jsonb),
    ('junior', 'Junior Rising Star', 'Junior', 1499.00, 14390.00, 'monthly', 'Under 18s', false,
     'Tailored for young aspiring athletes to train, compete, and access structured academy clinics.',
     'Free off-peak court access (3 PM - 6 PM weekdays)', 10.00, 10.00, 50.00, 5, 0,
     '["Complimentary off-peak court access (weekday afternoons)", "Weekly weekend Junior coaching clinic included", "10% discount on junior rackets, shoes & balls", "Structured quarterly skill progression badge tests", "Parent lounge access during practice sessions"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    tier = EXCLUDED.tier,
    price = EXCLUDED.price,
    annual_price = EXCLUDED.annual_price,
    features = EXCLUDED.features;

-- ----------------------------------------------------------------------------
-- 4. MEMBERSHIPS
-- ----------------------------------------------------------------------------
INSERT INTO memberships (member_id, plan_id, start_date, end_date, status, auto_renew, payment_frequency)
VALUES
    ('MEM-8801', 'gold', CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE + INTERVAL '305 days', 'active', true, 'annual'),
    ('MEM-4920', 'silver', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '335 days', 'active', true, 'monthly'),
    ('MEM-1002', 'gold', CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE + INTERVAL '275 days', 'active', true, 'annual'),
    ('MEM-3120', 'gold', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE + INTERVAL '350 days', 'active', true, 'monthly'),
    ('MEM-1092', 'silver', CURRENT_DATE - INTERVAL '400 days', CURRENT_DATE - INTERVAL '35 days', 'expired', false, 'monthly')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. SPORTS
-- ----------------------------------------------------------------------------
INSERT INTO sports (id, name, description, icon)
VALUES
    ('tennis', 'Tennis', 'Championship hard and European clay tennis courts with competition lighting.', 'tennis'),
    ('cricket', 'Cricket', 'High-density indoor turf box cricket arenas with live digital scoreboard.', 'activity'),
    ('padel', 'Padel', 'Panoramic toughened glass padel courts with synthetic turf.', 'layers'),
    ('badminton', 'Badminton', 'BWF-approved synthetic rubber flooring courts with air cooling.', 'zap'),
    ('squash', 'Squash', 'WSF standard glass-back squash courts with shock absorption.', 'square')
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 6. COURTS
-- ----------------------------------------------------------------------------
INSERT INTO courts (id, sport_id, name, surface, indoor, lighting, hourly_rate, member_rate, gold_rate, max_players, description)
VALUES
    ('court-1', 'tennis', 'Centre Court (Tennis)', 'Championship Hard Court (Plexipave)', false, 'LED Floodlights 1000 Lux', 800.00, 400.00, 0.00, 4, 'Our premier outdoor tournament court with cushioned acrylic surface, spectator bleachers, and broadcast lighting.'),
    ('court-2', 'tennis', 'Court 2 - Clay (Tennis)', 'European Red Clay', false, 'LED Floodlights 800 Lux', 700.00, 350.00, 0.00, 4, 'Authentic clay court delivering gentle slide, higher bounce, and minimal strain on players knees and joints.'),
    ('court-3', 'cricket', 'Box Cricket Arena 1', 'High-Density AstroTurf Pro', true, 'High-Bay Shadowless Arena Lights', 1200.00, 600.00, 0.00, 16, 'Enclosed 100ft x 50ft box cricket turf with overhead safety netting and automated bowling machine capabilities.'),
    ('court-4', 'cricket', 'Box Cricket Arena 2', 'Shock-Absorbing Turf Wicket', true, 'High-Bay Shadowless Arena Lights', 1200.00, 600.00, 0.00, 16, 'Designed for dynamic 6v6 and 8v8 indoor matches with live digital scoreboard and spectator gallery.'),
    ('court-5', 'padel', 'Padel Court Alpha', 'Panoramic 12mm Toughened Glass + Synthetic Turf', false, 'Anti-Glare Column LED', 900.00, 450.00, 0.00, 4, 'Next-generation panoramic padel court built to International Padel Federation tournament guidelines.')
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 7. PRODUCT CATEGORIES
-- ----------------------------------------------------------------------------
INSERT INTO product_categories (id, name, description)
VALUES
    ('rackets', 'Rackets', 'High-performance tennis and padel rackets'),
    ('balls', 'Balls', 'Tournament grade tennis and cricket balls'),
    ('shoes', 'Shoes', 'All-court and clay specialized sports footwear'),
    ('cricket', 'Cricket Gear', 'Professional bats, pads, gloves and safety armor'),
    ('accessories', 'Accessories', 'Grips, dampeners, bags, and strings')
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 8. PRODUCTS & INVENTORY
-- ----------------------------------------------------------------------------
INSERT INTO products (id, category_id, sport_id, name, sku, price, member_price, rating, badge, description, image_url)
VALUES
    ('prod-1', 'rackets', 'tennis', 'Head Speed Pro 2026 Tennis Racket', 'SKU-HD-SPD26', 15499.00, 12399.00, 4.9, 'Best Seller', 'Engineered for fast-swinging tournament players seeking razor-sharp control and effortless spin.', 'https://images.unsplash.com/photo-1617083934555-ac7d4fed8889?w=600&auto=format&fit=crop&q=80'),
    ('prod-2', 'balls', 'tennis', 'Wilson US Open Extra Duty Balls (Can of 4)', 'SKU-WIL-USO4', 699.00, 559.00, 4.8, 'Official Ball', 'The standard of excellence for hard courts. Premium woven felt provides unmatched durability and true flight.', 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=600&auto=format&fit=crop&q=80'),
    ('prod-3', 'shoes', 'tennis', 'Asics Gel-Resolution 9 All-Court Shoes', 'SKU-ASC-GEL9', 11499.00, 9199.00, 4.9, 'Top Pick', 'Featuring DYNAWALL lateral stability and full-length FLYTEFOAM cushioning for explosive footwork.', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80'),
    ('prod-4', 'cricket', 'cricket', 'SS Ton Reserve Edition English Willow Bat', 'SKU-SS-TONRES', 19999.00, 15999.00, 5.0, 'Pro Grade', 'Grade 1 air-dried English Willow with massive contoured edges, 8-10 straight grains and featherlight balance.', 'https://images.unsplash.com/photo-1531415074868-036b107e775a?w=600&auto=format&fit=crop&q=80'),
    ('prod-5', 'accessories', 'tennis', 'Babolat RH12 Pure Aero Championship Bag', 'SKU-BAB-RH12', 9299.00, 7439.00, 4.7, 'Out of Stock', 'Holds up to 12 rackets in temperature-shielded thermal compartments. Includes ventilated wet gear pouch.', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80'),
    ('prod-6', 'accessories', 'tennis', 'Babolat RPM Blast 1.25mm String + Express Stringing', 'SKU-BAB-RPM125', 1699.00, 1359.00, 4.9, 'In-House Service', 'Maximum topspin and snap-back with octagonal profile. Includes instant restringing at our club pro shop desk.', 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=600&auto=format&fit=crop&q=80'),
    ('prod-7', 'rackets', 'padel', 'Bullpadel Vertex 03 Diamond Padel Racket', 'SKU-BUL-VTX03', 18999.00, 15199.00, 4.8, 'WPT Choice', 'Diamond shape for maximum power. Multi-EVA core and Xtend Carbon 12K surface for superior touch.', 'https://images.unsplash.com/photo-1563299796-17596ed6b017?w=600&auto=format&fit=crop&q=80'),
    ('prod-8', 'balls', 'cricket', 'SG Club Poly Match Leather Cricket Balls (Box of 6)', 'SKU-SG-CLB6', 2499.00, 1999.00, 4.6, 'Match Ball', 'Alum tanned high-grade leather with linen stitching, formulated for match endurance on turf wickets.', 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=600&auto=format&fit=crop&q=80')
ON CONFLICT (id) DO NOTHING;

INSERT INTO inventory (product_id, quantity_on_hand, quantity_reserved, reorder_threshold, reorder_quantity)
VALUES
    ('prod-1', 8, 0, 3, 10),
    ('prod-2', 45, 2, 10, 50),
    ('prod-3', 6, 0, 2, 10),
    ('prod-4', 3, 0, 1, 5),
    ('prod-5', 0, 0, 2, 5),
    ('prod-6', 22, 1, 5, 25),
    ('prod-7', 5, 0, 2, 8),
    ('prod-8', 15, 0, 4, 20)
ON CONFLICT (product_id) DO UPDATE SET
    quantity_on_hand = EXCLUDED.quantity_on_hand,
    quantity_reserved = EXCLUDED.quantity_reserved;

-- ----------------------------------------------------------------------------
-- 9. BAR TABLES
-- ----------------------------------------------------------------------------
INSERT INTO bar_tables (id, number, name, section, capacity, status)
VALUES
    ('table-1', 1, 'Table 1 - Tennis Lounge', 'Lounge', 4, 'occupied'),
    ('table-2', 2, 'Table 2 - Courtside High-Top', 'Courtside', 2, 'available'),
    ('table-3', 3, 'Table 3 - Pavilion Terrace', 'Terrace', 6, 'open'),
    ('table-4', 4, 'Table 4 - Central Bar Counter', 'Bar Counter', 2, 'available'),
    ('table-5', 5, 'Table 5 - VIP Players Booth', 'VIP Booth', 8, 'occupied'),
    ('table-6', 6, 'Table 6 - Cricket Deck High-Top', 'Terrace', 4, 'available'),
    ('table-7', 7, 'Table 7 - Padel Viewing Deck', 'Courtside', 4, 'open'),
    ('table-8', 8, 'Table 8 - Members Snug', 'Lounge', 6, 'available')
ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    section = EXCLUDED.section;

-- ----------------------------------------------------------------------------
-- 10. MENU ITEMS
-- ----------------------------------------------------------------------------
INSERT INTO menu_items (id, name, category, price, member_price, description, prep_time_minutes, alcoholic, badge, in_stock, stock)
VALUES
    ('bev-1', 'Champions Draft Craft Lager (500ml)', 'Beers & Ciders', 380.00, 323.00, 'Crisp golden Bavarian-style pilsner brewed exclusively for Champions Club members.', 2, true, 'Club Favourite', true, 64),
    ('bev-2', 'Bira 91 White Wheat Ale', 'Beers & Ciders', 360.00, 306.00, 'Aromatic low-bitterness wheat beer with hints of coriander and fresh orange peel.', 2, true, null, true, 42),
    ('bev-3', 'Sheppy’s Vintage Apple Cider', 'Beers & Ciders', 420.00, 357.00, 'Refreshing English traditional sparkling cider from Somerset cider orchards.', 2, true, null, true, 18),
    ('bev-4', 'Wimbledon Pimm’s Cup No.1', 'Signature Cocktails', 520.00, 442.00, 'Pimm’s No. 1 infused with cucumber ribbons, garden mint, strawberries and premium ginger ale.', 4, true, 'Signature', true, 30),
    ('bev-5', 'Smoky Mezcal Paloma', 'Signature Cocktails', 580.00, 493.00, 'Artisanal Mezcal, fresh pink grapefruit reduction, lime juice and Himalayan black salt rim.', 5, true, null, true, 25),
    ('bev-6', 'Court Ace Gin & Tonic', 'Signature Cocktails', 490.00, 416.00, 'Botanical London Dry gin with rosemary sprig, dried juniper berries and elderflower tonic.', 3, true, null, true, 28),
    ('rec-1', 'Electro-Hydrate Coconut Cooler', 'Recovery & Smoothies', 240.00, 204.00, 'Pure tender coconut water, chia seeds, lime spritz and pink salt for rapid recovery.', 3, false, 'Post-Match', true, 50),
    ('rec-2', 'Match Point Whey Protein Shake', 'Recovery & Smoothies', 320.00, 272.00, '30g grass-fed vanilla whey, almond butter, ripe banana, oats and unsweetened oat milk.', 4, false, 'Fitness', true, 35),
    ('rec-3', 'Wild Berry Antioxidant Blast', 'Recovery & Smoothies', 280.00, 238.00, 'Blueberries, raspberries, Greek yoghurt, raw organic honey and pomegranate reduction.', 4, false, null, true, 22),
    ('food-1', 'Crispy Truffle Parmesan Fries', 'Bar Bites', 340.00, 289.00, 'Hand-cut Idaho potatoes tossed in white truffle oil, 24-month aged parmesan and fresh parsley.', 8, false, 'Bestseller', true, 40),
    ('food-2', 'Wood-Fired Garlic Butter Chicken Wings', 'Bar Bites', 460.00, 391.00, 'Smoky clay-oven wings glazed in roasted garlic butter with sriracha lime dip.', 12, false, null, true, 26),
    ('food-3', 'Avocado & Burrata Bruschetta', 'Bar Bites', 420.00, 357.00, 'Charred sourdough, smashed Hass avocado, creamy Pugliese burrata and aged balsamic glaze.', 7, false, null, true, 20),
    ('food-4', 'Paneer Tikka Crostini', 'Bar Bites', 380.00, 323.00, 'Marinated cottage cheese skewers roasted in the tandoor with mint emulsion and pickled shallots.', 10, false, null, true, 32),
    ('main-1', 'Champions Smashed Angus Cheeseburger', 'Mains', 580.00, 493.00, 'Double Angus beef patties, sharp Wisconsin cheddar, brioche bun, house relish with crisp fries.', 15, false, 'Chef Special', true, 18),
    ('main-2', 'Rustic Margherita Pinsa Romana', 'Mains', 520.00, 442.00, 'Slow-fermented cloud crust, San Marzano tomato reduction, fior di latte and sweet basil.', 14, false, null, true, 25),
    ('main-3', 'Grilled Salmon Caesar Power Bowl', 'Mains', 640.00, 544.00, 'Norwegian salmon fillet, crisp baby romaine, soft-boiled organic egg, sourdough croutons.', 12, false, null, true, 12)
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 11. BAR ORDERS & ITEMS
-- ----------------------------------------------------------------------------
INSERT INTO bar_orders (id, table_id, member_id, guest_name, membership_tier, status, kitchen_status, discount_percentage, subtotal, discount_amount, tax, total, created_at)
VALUES
    ('ORD-201', 'table-1', 'MEM-8801', 'Devon Conway', 'Gold', 'open', 'PREPARING', 15.00, 1680.00, 252.00, 71.40, 1499.40, CURRENT_TIMESTAMP - INTERVAL '18 minutes'),
    ('ORD-202', 'table-3', 'MEM-4920', 'Sarah Jenkins', 'Silver', 'open', 'READY', 10.00, 2900.00, 290.00, 130.50, 2740.50, CURRENT_TIMESTAMP - INTERVAL '32 minutes'),
    ('ORD-203', 'table-5', 'MEM-1002', 'Rajesh Sharma', 'Gold', 'open', 'PENDING', 15.00, 4120.00, 618.00, 175.10, 3677.10, CURRENT_TIMESTAMP - INTERVAL '8 minutes'),
    ('ORD-204', 'table-7', null, 'Walk-in Guest', 'Guest', 'open', 'SERVED', 0.00, 820.00, 0.00, 41.00, 861.00, CURRENT_TIMESTAMP - INTERVAL '45 minutes'),
    ('ORD-200-SETTLED', 'table-4', 'MEM-3120', 'Michael Chang', 'Gold', 'settled', 'SERVED', 15.00, 760.00, 114.00, 32.30, 678.30, CURRENT_TIMESTAMP - INTERVAL '75 minutes')
ON CONFLICT (id) DO NOTHING;

INSERT INTO bar_order_items (bar_order_id, item_id, quantity, unit_price, notes, kitchen_status)
VALUES
    ('ORD-201', 'bev-1', 2, 380.00, 'Chilled glasses please', 'SERVED'),
    ('ORD-201', 'food-1', 1, 340.00, 'Extra truffle dip', 'PREPARING'),
    ('ORD-201', 'main-1', 1, 580.00, 'Medium rare, no pickles', 'PREPARING'),
    ('ORD-202', 'bev-4', 3, 520.00, '', 'READY'),
    ('ORD-202', 'food-2', 2, 460.00, 'Extra spicy glaze', 'READY'),
    ('ORD-202', 'food-3', 1, 420.00, 'Gluten-free toast if possible', 'READY'),
    ('ORD-203', 'bev-5', 4, 580.00, 'Low ice', 'PENDING'),
    ('ORD-203', 'main-2', 2, 520.00, 'Extra fresh basil', 'PENDING'),
    ('ORD-203', 'food-4', 2, 380.00, '', 'PENDING'),
    ('ORD-204', 'rec-1', 2, 240.00, '', 'SERVED'),
    ('ORD-204', 'food-1', 1, 340.00, '', 'SERVED'),
    ('ORD-200-SETTLED', 'bev-1', 2, 380.00, '', 'SERVED')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 12. EMPLOYEES
-- ----------------------------------------------------------------------------
INSERT INTO employees (id, user_id, employee_number, first_name, last_name, email, phone, department, designation, pin, hourly_rate, salary, joined_date)
VALUES
    ('STF-001', '22222222-2222-2222-2222-222222222221', 'EMP-2026-001', 'Kenil', 'Patel', 'kenil.patel@championsclub.com', '+919876543201', 'bar', 'Bar & Lounge Manager', '1234', 250.00, 45000.00, '2025-01-15'),
    ('STF-002', '22222222-2222-2222-2222-222222222222', 'EMP-2026-002', 'Priya', 'Nair', 'priya.nair@championsclub.com', '+919876543202', 'bar', 'Head Bartender & Mixologist', '2233', 200.00, 36000.00, '2025-03-01'),
    ('STF-003', '22222222-2222-2222-2222-222222222223', 'EMP-2026-003', 'Arjun', 'Singh', 'arjun.singh@championsclub.com', '+919876543203', 'bar', 'Floor Waiter & Runner', '4455', 140.00, 24000.00, '2025-05-10'),
    ('STF-004', '22222222-2222-2222-2222-222222222224', 'EMP-2026-004', 'Ananya', 'Roy', 'ananya.roy@championsclub.com', '+919876543204', 'reception', 'POS Cashier & Hostess', '9900', 160.00, 28000.00, '2025-02-20')
ON CONFLICT (id) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 13. LEADS, FOLLOWUPS, TRIAL BOOKINGS
-- ----------------------------------------------------------------------------
INSERT INTO leads (id, name, email, phone, sport, interest_tier, source, status, message)
VALUES
    ('LEAD-101', 'Rohan Mehta', 'rohan.mehta@example.com', '+919822334455', 'Tennis', 'Gold', 'website', 'trial_booked', 'Interested in peak evening tennis slot access and weekend coaching.'),
    ('LEAD-102', 'Kavita Iyer', 'kavita.iyer@example.com', '+919811223344', 'Cricket', 'Silver', 'website', 'contacted', 'Looking for box cricket weekend arena booking for company sports team.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO lead_followups (lead_id, followup_date, contact_method, summary, outcome, next_action_date)
VALUES
    ('LEAD-101', CURRENT_TIMESTAMP - INTERVAL '2 days', 'phone', 'Discussed Gold membership benefits and confirmed trial session.', 'Positive interest', CURRENT_DATE + 3)
ON CONFLICT DO NOTHING;

INSERT INTO trial_bookings (id, lead_id, court_id, scheduled_time, duration_minutes, status, feedback)
VALUES
    ('44444444-4444-4444-4444-444444444441', 'LEAD-101', 'court-1', CURRENT_TIMESTAMP + INTERVAL '2 days', 60, 'scheduled', 'Guest looking forward to testing Centre Court Plexipave.')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 14. BOOKINGS
-- ----------------------------------------------------------------------------
INSERT INTO bookings (id, booking_number, court_id, member_id, booking_date, start_time, end_time, booking_type, status, rate_applied, total_amount, payment_status)
VALUES
    ('55555555-5555-5555-5555-555555555551', 'BK-2026-0001', 'court-1', 'MEM-8801', CURRENT_DATE, (CURRENT_DATE + TIME '07:00:00') AT TIME ZONE 'UTC', (CURRENT_DATE + TIME '08:00:00') AT TIME ZONE 'UTC', 'ordinary', 'confirmed', 0.00, 0.00, 'waived'),
    ('55555555-5555-5555-5555-555555555552', 'BK-2026-0002', 'court-3', 'MEM-4920', CURRENT_DATE, (CURRENT_DATE + TIME '18:00:00') AT TIME ZONE 'UTC', (CURRENT_DATE + TIME '19:00:00') AT TIME ZONE 'UTC', 'ordinary', 'confirmed', 600.00, 600.00, 'paid')
ON CONFLICT (id) DO NOTHING;

INSERT INTO booking_participants (booking_id, member_id, name, is_primary)
VALUES
    ('55555555-5555-5555-5555-555555555551', 'MEM-8801', 'Devon Conway', true),
    ('55555555-5555-5555-5555-555555555552', 'MEM-4920', 'Sarah Jenkins', true)
ON CONFLICT DO NOTHING;
