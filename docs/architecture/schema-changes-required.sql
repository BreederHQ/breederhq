-- ============================================================================
-- BREEDERHQ PLATFORM: REQUIRED SCHEMA CHANGES
-- ============================================================================
-- Review Date: 2026-01-12
-- Status: REQUIRED FOR PRODUCTION
-- Priority: CRITICAL
--
-- This file contains all schema changes required before production deployment
-- of the marketplace functionality. These changes address critical flaws
-- identified in the architectural review.
--
-- NOTE: Run these migrations in the order specified.
-- Use CONCURRENTLY for index creation to avoid table locks.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SECTION 1: Cross-Database Referential Integrity
-- ----------------------------------------------------------------------------
-- Purpose: Prevent orphaned records when data is deleted from one database
--          while still referenced from another database
-- ----------------------------------------------------------------------------

-- Add soft delete support to invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_invoices_deleted ON invoices(deleted_at) WHERE deleted_at IS NULL;

-- Cross-database reference tracking table (in public schema)
CREATE TABLE IF NOT EXISTS cross_db_references (
  id SERIAL PRIMARY KEY,
  source_db VARCHAR(50) NOT NULL,
  source_table VARCHAR(100) NOT NULL,
  source_id BIGINT NOT NULL,
  target_db VARCHAR(50) NOT NULL,
  target_table VARCHAR(100) NOT NULL,
  target_id BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(source_db, source_table, source_id, target_db, target_table, target_id)
);

CREATE INDEX idx_cross_db_refs_source ON cross_db_references(source_db, source_table, source_id);
CREATE INDEX idx_cross_db_refs_target ON cross_db_references(target_db, target_table, target_id);

-- ----------------------------------------------------------------------------
-- SECTION 2: Payment Mode Locking (Race Condition Fix)
-- ----------------------------------------------------------------------------
-- Purpose: Prevent payment mode switch during invoice creation
-- ----------------------------------------------------------------------------

-- Add payment mode snapshot fields to tenant invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_mode_snapshot VARCHAR(50);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_mode_locked_at TIMESTAMP;

-- Add payment mode snapshot fields to marketplace invoices
-- (Create marketplace_invoices table if it doesn't exist yet)
-- ALTER TABLE marketplace_invoices ADD COLUMN IF NOT EXISTS payment_mode_snapshot VARCHAR(50);
-- ALTER TABLE marketplace_invoices ADD COLUMN IF NOT EXISTS payment_mode_locked_at TIMESTAMP;

-- ----------------------------------------------------------------------------
-- SECTION 3: Tenant Isolation Security (Contact.marketplaceUserId)
-- ----------------------------------------------------------------------------
-- Purpose: Prevent cross-tenant data leakage via marketplace user lookups
-- ----------------------------------------------------------------------------

-- Replace simple index with compound unique constraint
DROP INDEX IF EXISTS idx_contacts_marketplace_user;

CREATE UNIQUE INDEX idx_contacts_marketplace_user_tenant
  ON contacts(marketplace_user_id, tenant_id)
  WHERE marketplace_user_id IS NOT NULL;

-- Enable Row-Level Security (PostgreSQL)
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for tenant isolation
-- NOTE: Application must set current_tenant_id session variable
CREATE POLICY IF NOT EXISTS contact_tenant_isolation ON contacts
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::int);

-- ----------------------------------------------------------------------------
-- SECTION 4: Simplify Dual Invoice Architecture
-- ----------------------------------------------------------------------------
-- Purpose: Eliminate synchronization complexity between tenant and marketplace invoices
-- ----------------------------------------------------------------------------

-- For marketplace transactions: replace dual invoice fields with single reference
-- ALTER TABLE marketplace_transactions DROP COLUMN IF EXISTS tenant_invoice_id;
-- ALTER TABLE marketplace_transactions DROP COLUMN IF EXISTS marketplace_invoice_id;
-- ALTER TABLE marketplace_transactions ADD COLUMN IF NOT EXISTS invoice_type VARCHAR(20) NOT NULL DEFAULT 'marketplace' CHECK (invoice_type IN ('tenant', 'marketplace'));
-- ALTER TABLE marketplace_transactions ADD COLUMN IF NOT EXISTS invoice_id BIGINT NOT NULL;
-- ALTER TABLE marketplace_transactions ADD COLUMN IF NOT EXISTS invoice_database VARCHAR(20) NOT NULL DEFAULT 'marketplace' CHECK (invoice_database IN ('tenant', 'marketplace'));

-- CREATE INDEX idx_transactions_invoice ON marketplace_transactions(invoice_type, invoice_id);

-- ----------------------------------------------------------------------------
-- SECTION 5: Fix Data Types (Prevent Overflow)
-- ----------------------------------------------------------------------------
-- Purpose: Use BIGINT for high-volume tables and currency fields
-- ----------------------------------------------------------------------------

-- Marketplace transactions (high volume)
-- ALTER TABLE marketplace_transactions ALTER COLUMN id TYPE BIGINT;

-- Messages (high volume)
-- ALTER TABLE messages ALTER COLUMN id TYPE BIGINT;

-- Currency fields (prevent overflow at $21M+)
ALTER TABLE invoices ALTER COLUMN amount_cents TYPE BIGINT;
ALTER TABLE invoices ALTER COLUMN balance_cents TYPE BIGINT;
ALTER TABLE invoices ALTER COLUMN deposit_cents TYPE BIGINT;

-- ALTER TABLE marketplace_invoices ALTER COLUMN total_cents TYPE BIGINT;
-- ALTER TABLE marketplace_transactions ALTER COLUMN total_cents TYPE BIGINT;
-- ALTER TABLE marketplace_transactions ALTER COLUMN platform_fee_cents TYPE BIGINT;
-- ALTER TABLE marketplace_transactions ALTER COLUMN stripe_fee_cents TYPE BIGINT;
-- ALTER TABLE marketplace_transactions ALTER COLUMN provider_payout_cents TYPE BIGINT;

-- Optimize string lengths
-- ALTER TABLE marketplace_invoices ALTER COLUMN invoice_number TYPE VARCHAR(50);
-- ALTER TABLE marketplace_invoices ALTER COLUMN stripe_invoice_id TYPE VARCHAR(50);
-- ALTER TABLE marketplace_transactions ALTER COLUMN stripe_invoice_id TYPE VARCHAR(50);

-- ----------------------------------------------------------------------------
-- SECTION 6: Add Missing Composite Indexes
-- ----------------------------------------------------------------------------
-- Purpose: Optimize query performance for common access patterns
-- ----------------------------------------------------------------------------

-- Transaction queries by provider + status + date
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_provider_status_created
--   ON marketplace_transactions(provider_id, status, created_at DESC);

-- Transaction queries by client + status + date
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_client_status_created
--   ON marketplace_transactions(client_id, status, created_at DESC);

-- Message pagination
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_thread_created
--   ON messages(thread_id, created_at DESC) INCLUDE (read_at);

-- Service listing search
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_listings_active_search
--   ON service_listings(status, category, state, city)
--   WHERE status = 'active';

-- Marketplace invoice lookups
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_marketplace_invoices_transaction_status
--   ON marketplace_invoices(transaction_id, status);

-- Tenant invoice marketplace queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_marketplace_transaction
  ON invoices(tenant_id, is_marketplace_invoice, status)
  WHERE is_marketplace_invoice = TRUE;

-- ----------------------------------------------------------------------------
-- SECTION 7: Normalize JSON Columns
-- ----------------------------------------------------------------------------
-- Purpose: Enable proper querying and indexing of nested data
-- ----------------------------------------------------------------------------

-- Service listing images (was JSON array)
-- CREATE TABLE IF NOT EXISTS service_listing_images (
--   id SERIAL PRIMARY KEY,
--   listing_id INTEGER NOT NULL REFERENCES service_listings(id) ON DELETE CASCADE,
--   url VARCHAR(500) NOT NULL,
--   caption TEXT,
--   sort_order INTEGER DEFAULT 0,
--   created_at TIMESTAMP DEFAULT NOW(),
--   updated_at TIMESTAMP DEFAULT NOW()
-- );

-- CREATE INDEX idx_listing_images_listing ON service_listing_images(listing_id, sort_order);

-- Marketplace invoice line items (was JSON array)
-- CREATE TABLE IF NOT EXISTS marketplace_invoice_line_items (
--   id SERIAL PRIMARY KEY,
--   invoice_id INTEGER NOT NULL REFERENCES marketplace_invoices(id) ON DELETE CASCADE,
--   description TEXT NOT NULL,
--   quantity INTEGER NOT NULL DEFAULT 1,
--   unit_price_cents BIGINT NOT NULL,
--   total_cents BIGINT NOT NULL,
--   sort_order INTEGER DEFAULT 0,
--   created_at TIMESTAMP DEFAULT NOW()
-- );

-- CREATE INDEX idx_invoice_line_items_invoice ON marketplace_invoice_line_items(invoice_id, sort_order);

-- Add GIN index if keeping category_metadata as JSONB
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_service_listings_metadata_gin
--   ON service_listings USING GIN (category_metadata);

-- ----------------------------------------------------------------------------
-- SECTION 8: Financial Data Integrity
-- ----------------------------------------------------------------------------
-- Purpose: Support partial refunds and reconciliation tracking
-- ----------------------------------------------------------------------------

-- Add partial refund support
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS refunded_cents BIGINT DEFAULT 0;
-- ALTER TABLE marketplace_invoices ADD COLUMN IF NOT EXISTS refunded_cents BIGINT DEFAULT 0;

-- Add reconciliation tracking (Stripe vs DB state)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS reconciliation_status VARCHAR(50) DEFAULT 'synced';
-- ALTER TABLE marketplace_invoices ADD COLUMN IF NOT EXISTS reconciliation_status VARCHAR(50) DEFAULT 'synced';

-- ----------------------------------------------------------------------------
-- SECTION 9: Payment Security Enhancements
-- ----------------------------------------------------------------------------
-- Purpose: Fraud prevention and dispute resolution
-- ----------------------------------------------------------------------------

-- Require payment receipt for manual payments
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS buyer_payment_receipt_url VARCHAR(500);
-- ALTER TABLE marketplace_invoices ADD COLUMN IF NOT EXISTS buyer_payment_receipt_url VARCHAR(500);

-- Add constraint (commented out - requires application logic first)
-- ALTER TABLE invoices ADD CONSTRAINT chk_manual_payment_receipt
--   CHECK (
--     (payment_mode != 'manual' OR buyer_marked_paid_at IS NULL)
--     OR buyer_payment_receipt_url IS NOT NULL
--   );

-- Index for auto-expiring pending confirmations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_pending_confirmation_age
  ON invoices(status, buyer_marked_paid_at)
  WHERE status = 'pending_confirmation';

-- ----------------------------------------------------------------------------
-- SECTION 10: Webhook & Audit Tables
-- ----------------------------------------------------------------------------
-- Purpose: Idempotency, retry logic, and compliance
-- ----------------------------------------------------------------------------

-- Stripe webhook event tracking
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(100) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',  -- pending, success, failed
  attempts INTEGER DEFAULT 1,
  processed_at TIMESTAMP,
  invoice_id BIGINT,
  invoice_database VARCHAR(20),
  amount_cents BIGINT,
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_status ON stripe_webhook_events(status, created_at);
CREATE INDEX idx_webhook_events_failed ON stripe_webhook_events(status, attempts) WHERE status = 'failed';
CREATE INDEX idx_webhook_events_event_id_status ON stripe_webhook_events(event_id, status);

-- Invoice audit log
CREATE TABLE IF NOT EXISTS invoice_audit_log (
  id SERIAL PRIMARY KEY,
  invoice_id BIGINT NOT NULL,
  invoice_database VARCHAR(20) NOT NULL,
  changed_by_user_id VARCHAR(50),
  changed_at TIMESTAMP DEFAULT NOW(),
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  payment_mode VARCHAR(50),
  metadata JSONB
);

CREATE INDEX idx_invoice_audit_invoice ON invoice_audit_log(invoice_database, invoice_id, changed_at DESC);
CREATE INDEX idx_invoice_audit_user ON invoice_audit_log(changed_by_user_id, changed_at DESC);

-- Payment confirmation audit
CREATE TABLE IF NOT EXISTS payment_confirmation_audit (
  id SERIAL PRIMARY KEY,
  invoice_id BIGINT NOT NULL,
  invoice_database VARCHAR(20) NOT NULL,
  marked_paid_by_user_id VARCHAR(50),
  marked_paid_at TIMESTAMP,
  confirmed_by_user_id VARCHAR(50),
  confirmed_at TIMESTAMP,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(255),
  metadata JSONB
);

CREATE INDEX idx_payment_audit_invoice ON payment_confirmation_audit(invoice_database, invoice_id);
CREATE INDEX idx_payment_audit_user ON payment_confirmation_audit(marked_paid_by_user_id, marked_paid_at DESC);

-- Authorization audit log
CREATE TABLE IF NOT EXISTS authorization_audit (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50),
  resource_type VARCHAR(100),
  resource_id VARCHAR(100),
  action VARCHAR(50),
  allowed BOOLEAN,
  reason TEXT,
  requested_at TIMESTAMP DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX idx_auth_audit_user ON authorization_audit(user_id, requested_at DESC);
CREATE INDEX idx_auth_audit_denied ON authorization_audit(allowed, requested_at DESC) WHERE allowed = FALSE;
CREATE INDEX idx_auth_audit_resource ON authorization_audit(resource_type, resource_id, requested_at DESC);

-- Cross-tenant access audit log
CREATE TABLE IF NOT EXISTS cross_tenant_query_audit (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50),
  source_tenant_id INTEGER,
  target_tenant_id INTEGER,
  query_type VARCHAR(100),
  allowed BOOLEAN,
  reason TEXT,
  executed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cross_tenant_audit_user ON cross_tenant_query_audit(user_id, executed_at DESC);
CREATE INDEX idx_cross_tenant_audit_denied ON cross_tenant_query_audit(allowed, executed_at DESC) WHERE allowed = FALSE;

-- ----------------------------------------------------------------------------
-- SECTION 11: Table Partitioning (For Scalability)
-- ----------------------------------------------------------------------------
-- Purpose: Manage high-volume table growth (messages, transactions)
-- ----------------------------------------------------------------------------

-- Messages table partitioning (10M+ messages/year projected)
-- NOTE: This requires recreating the messages table as partitioned
-- Uncomment and adapt when ready to implement

/*
-- Create partitioned messages table
CREATE TABLE messages_partitioned (
  id BIGINT PRIMARY KEY,
  thread_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  sender_type VARCHAR(50) NOT NULL,
  message_text TEXT NOT NULL,
  attachments JSONB,
  sent_via_email BOOLEAN DEFAULT FALSE,
  email_message_id VARCHAR(255),
  read_at TIMESTAMP,
  read_by INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create partitions for 2026-2028
CREATE TABLE messages_2026 PARTITION OF messages_partitioned
  FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

CREATE TABLE messages_2027 PARTITION OF messages_partitioned
  FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');

CREATE TABLE messages_2028 PARTITION OF messages_partitioned
  FOR VALUES FROM ('2028-01-01') TO ('2029-01-01');

-- Indexes on partitions
CREATE INDEX idx_messages_2026_thread_created ON messages_2026(thread_id, created_at DESC);
CREATE INDEX idx_messages_2027_thread_created ON messages_2027(thread_id, created_at DESC);
CREATE INDEX idx_messages_2028_thread_created ON messages_2028(thread_id, created_at DESC);

-- Migrate data from old table to new partitioned table
-- INSERT INTO messages_partitioned SELECT * FROM messages;

-- Rename tables (after migration complete)
-- ALTER TABLE messages RENAME TO messages_old;
-- ALTER TABLE messages_partitioned RENAME TO messages;
*/

-- ----------------------------------------------------------------------------
-- SECTION 12: Marketplace-Specific Schema (If Dual Database Approach)
-- ----------------------------------------------------------------------------
-- Purpose: Tables for separate marketplace database (if that approach is chosen)
-- ----------------------------------------------------------------------------

-- NOTE: These are commented out because they belong in the marketplace database
-- Uncomment if proceeding with dual-database strategy

/*
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP,
  phone VARCHAR(50),
  phone_verified BOOLEAN DEFAULT FALSE,
  phone_verified_at TIMESTAMP,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  display_name VARCHAR(200),
  avatar_url VARCHAR(500),
  user_type VARCHAR(50) DEFAULT 'buyer',
  tenant_id INTEGER,
  tenant_verified BOOLEAN DEFAULT FALSE,
  stripe_customer_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  notification_email BOOLEAN DEFAULT TRUE,
  notification_sms BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMP,
  last_login_ip VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT chk_user_type CHECK (user_type IN ('buyer', 'breeder', 'service_provider', 'both')),
  CONSTRAINT chk_user_status CHECK (status IN ('active', 'suspended', 'banned'))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tenant ON users(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX idx_users_stripe ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- Additional marketplace tables...
-- (See full marketplace schema in proposed design document)
*/

-- ============================================================================
-- END OF SCHEMA CHANGES
-- ============================================================================
--
-- MIGRATION NOTES:
-- 1. Test all migrations in staging environment first
-- 2. Use CREATE INDEX CONCURRENTLY to avoid table locks
-- 3. Back up data before running migrations
-- 4. Monitor query performance after index creation
-- 5. Update Prisma schema to match these changes
-- 6. Run prisma generate after schema updates
--
-- ROLLBACK STRATEGY:
-- - Each ALTER/CREATE statement should have corresponding DROP/REVERT
-- - Store backup LSN coordinates before migration
-- - Test rollback procedure in staging
--
-- ============================================================================
