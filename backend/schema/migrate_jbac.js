/**
 * Migration: Scalable Staff Job-Based Access Control (JBAC)
 * Batch-executed for high performance over remote database.
 */

const { query } = require('../src/config/database');

async function runMigration() {
  console.log('--- Starting JBAC Batch Database Migration ---');

  const migrationSQL = `
    -- 1. Create staff_job_types table
    CREATE TABLE IF NOT EXISTS staff_job_types (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_staff_job_types_code ON staff_job_types(code);
    CREATE INDEX IF NOT EXISTS idx_staff_job_types_is_active ON staff_job_types(is_active);

    -- 2. Create permissions table
    CREATE TABLE IF NOT EXISTS permissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code VARCHAR(100) UNIQUE NOT NULL,
      module VARCHAR(50) NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_permissions_code ON permissions(code);
    CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions(module);

    -- 3. Create staff_job_type_permissions junction table
    CREATE TABLE IF NOT EXISTS staff_job_type_permissions (
      staff_job_type_id UUID NOT NULL REFERENCES staff_job_types(id) ON DELETE CASCADE,
      permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
      PRIMARY KEY (staff_job_type_id, permission_id)
    );

    -- 4. Alter employees table: add staff_job_type_id column if not exists
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'staff_job_type_id'
      ) THEN
        ALTER TABLE employees ADD COLUMN staff_job_type_id UUID REFERENCES staff_job_types(id) ON DELETE RESTRICT;
      END IF;
    END $$;

    -- Drop CHECK constraint on employees.department if exists
    DO $$
    DECLARE
      chk_name text;
    BEGIN
      SELECT tc.constraint_name INTO chk_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
      WHERE tc.table_name = 'employees' AND cc.check_clause LIKE '%department%';
      
      IF chk_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE employees DROP CONSTRAINT ' || chk_name;
      END IF;
    END $$;

    -- 5. Seed Permissions (Single Batch)
    INSERT INTO permissions (code, module, description)
    VALUES
      ('products.view', 'products', 'View products catalogue'),
      ('products.create', 'products', 'Create new products'),
      ('products.update', 'products', 'Update products details and pricing'),
      ('products.delete', 'products', 'Delete or archive products'),
      ('inventory.view', 'inventory', 'View inventory levels and low stock'),
      ('inventory.create', 'inventory', 'Initialize inventory records'),
      ('inventory.update', 'inventory', 'Adjust inventory stock counts'),
      ('inventory.delete', 'inventory', 'Remove inventory records'),
      ('stock_movements.view', 'stock_movements', 'View stock movement history'),
      ('stock_movements.create', 'stock_movements', 'Record intake, adjustment, or write-off movements'),
      ('shop_orders.view', 'shop_orders', 'View customer shop orders'),
      ('shop_orders.update', 'shop_orders', 'Update order fulfillment status'),
      ('bar_tables.view', 'bar', 'View bar tables and occupancy'),
      ('bar_orders.view', 'bar', 'View bar orders and open tabs'),
      ('bar_orders.create', 'bar', 'Create and open bar orders'),
      ('bar_orders.update', 'bar', 'Add items, update kitchen status, settle tabs'),
      ('members.view', 'members', 'View member directory and profiles'),
      ('members.create', 'members', 'Register new club members'),
      ('members.update', 'members', 'Update member profile details'),
      ('courts.view', 'courts', 'View court schedule and availability'),
      ('bookings.view', 'bookings', 'View court bookings'),
      ('bookings.create', 'bookings', 'Book courts on behalf of members or guests'),
      ('bookings.cancel', 'bookings', 'Cancel existing court bookings'),
      ('leads.view', 'leads', 'View CRM enquiries and leads'),
      ('leads.create', 'leads', 'Create enquiry leads'),
      ('leads.update', 'leads', 'Update lead status and followups'),
      ('trial_bookings.view', 'trial_bookings', 'View trial coaching sessions'),
      ('trial_bookings.create', 'trial_bookings', 'Schedule trial coaching sessions'),
      ('invoices.view', 'finance', 'View club invoices'),
      ('payments.view', 'finance', 'View payment records'),
      ('expenses.view', 'expenses', 'View club expense audit log'),
      ('expenses.create', 'expenses', 'Record club expenditures'),
      ('expenses.update', 'expenses', 'Edit expense details'),
      ('expenses.delete', 'expenses', 'Void or remove expense entries')
    ON CONFLICT (code) DO UPDATE SET
      module = EXCLUDED.module,
      description = EXCLUDED.description;

    -- 6. Seed Default Staff Job Types
    INSERT INTO staff_job_types (code, name, description, is_active)
    VALUES
      ('bar', 'Bar Staff', 'Bar POS operations, drink preparation, kitchen status, and tab settlements.', true),
      ('shop_inventory', 'Shop & Inventory Staff', 'Pro shop catalogue management, inventory tracking, stock movements, and retail orders.', true),
      ('reception', 'Front Desk Staff', 'Member verification, check-in, bookings, trial sessions, and CRM leads.', true),
      ('sports_coaching', 'Sports & Coaching Staff', 'Court inspection, coaching sessions, and trial bookings.', true),
      ('maintenance', 'Maintenance Staff', 'Facility repairs, court maintenance, and equipment upkeep.', true),
      ('accounts', 'Accounts & Finance Staff', 'Club invoices, payment reconciliation, and expense tracking.', true)
    ON CONFLICT (code) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description;

    -- 7. Assign Permissions to Staff Job Types by Code (Resilient to any generated UUIDs)
    -- Bar Staff
    INSERT INTO staff_job_type_permissions (staff_job_type_id, permission_id)
    SELECT sjt.id, p.id FROM staff_job_types sjt
    CROSS JOIN permissions p
    WHERE sjt.code = 'bar'
      AND p.code IN ('bar_tables.view', 'bar_orders.view', 'bar_orders.create', 'bar_orders.update')
    ON CONFLICT DO NOTHING;

    -- Shop & Inventory Staff
    INSERT INTO staff_job_type_permissions (staff_job_type_id, permission_id)
    SELECT sjt.id, p.id FROM staff_job_types sjt
    CROSS JOIN permissions p
    WHERE sjt.code = 'shop_inventory'
      AND p.code IN (
        'products.view', 'products.update', 'products.delete',
        'inventory.view', 'inventory.create', 'inventory.update',
        'stock_movements.view', 'stock_movements.create',
        'shop_orders.view', 'shop_orders.update'
      )
    ON CONFLICT DO NOTHING;

    -- Front Desk Staff
    INSERT INTO staff_job_type_permissions (staff_job_type_id, permission_id)
    SELECT sjt.id, p.id FROM staff_job_types sjt
    CROSS JOIN permissions p
    WHERE sjt.code = 'reception'
      AND p.code IN (
        'members.view', 'members.create', 'members.update',
        'bookings.view', 'bookings.create',
        'trial_bookings.view', 'trial_bookings.create',
        'leads.view', 'leads.create', 'leads.update'
      )
    ON CONFLICT DO NOTHING;

    -- Sports & Coaching Staff
    INSERT INTO staff_job_type_permissions (staff_job_type_id, permission_id)
    SELECT sjt.id, p.id FROM staff_job_types sjt
    CROSS JOIN permissions p
    WHERE sjt.code = 'sports_coaching'
      AND p.code IN ('courts.view', 'bookings.view', 'trial_bookings.view', 'trial_bookings.create')
    ON CONFLICT DO NOTHING;

    -- Maintenance Staff
    INSERT INTO staff_job_type_permissions (staff_job_type_id, permission_id)
    SELECT sjt.id, p.id FROM staff_job_types sjt
    CROSS JOIN permissions p
    WHERE sjt.code = 'maintenance'
      AND p.code IN ('courts.view')
    ON CONFLICT DO NOTHING;

    -- Accounts & Finance Staff
    INSERT INTO staff_job_type_permissions (staff_job_type_id, permission_id)
    SELECT sjt.id, p.id FROM staff_job_types sjt
    CROSS JOIN permissions p
    WHERE sjt.code = 'accounts'
      AND p.code IN ('invoices.view', 'payments.view', 'expenses.view', 'expenses.create')
    ON CONFLICT DO NOTHING;

    -- 8. Map existing employees to staff_job_types by code
    UPDATE employees e
    SET staff_job_type_id = sjt.id
    FROM staff_job_types sjt
    WHERE e.staff_job_type_id IS NULL
      AND sjt.code = (
        CASE
          WHEN LOWER(e.department) LIKE '%bar%' THEN 'bar'
          WHEN LOWER(e.department) LIKE '%reception%' OR LOWER(e.department) LIKE '%front%' THEN 'reception'
          WHEN LOWER(e.department) LIKE '%sports%' OR LOWER(e.department) LIKE '%coach%' THEN 'sports_coaching'
          WHEN LOWER(e.department) LIKE '%maint%' THEN 'maintenance'
          WHEN LOWER(e.department) LIKE '%account%' OR LOWER(e.department) LIKE '%fin%' THEN 'accounts'
          ELSE 'bar'
        END
      );

    CREATE INDEX IF NOT EXISTS idx_employees_staff_job_type_id ON employees(staff_job_type_id);
  `;

  await query(migrationSQL);
  console.log('✅ JBAC Batch Migration Completed Successfully!');
}

runMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });
