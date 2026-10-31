-- Brightloop MySQL schema. The app also creates these tables automatically
-- when using SQLite for a quick local demo. Keep this schema in sync with
-- backend/app.py models.
CREATE DATABASE IF NOT EXISTS brightloop_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE brightloop_db;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'customer',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX ix_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  product_type VARCHAR(80) NOT NULL DEFAULT 'software',
  sales_price DECIMAL(12,2) NOT NULL,
  cost_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE product_variants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  additional_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  CONSTRAINT fk_variant_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT uq_variant_product_name UNIQUE (product_id, name)
) ENGINE=InnoDB;

CREATE TABLE tax_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  rate DECIMAL(6,3) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  name VARCHAR(120) NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  billing_frequency VARCHAR(12) NOT NULL,
  tax_rate DECIMAL(6,3) NOT NULL DEFAULT 0,
  tax_rule_id INT,
  min_quantity INT NOT NULL DEFAULT 1,
  available_from DATE,
  available_until DATE,
  auto_close BOOLEAN NOT NULL DEFAULT FALSE,
  allow_early_close BOOLEAN NOT NULL DEFAULT TRUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_plan_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_plan_tax_rule FOREIGN KEY (tax_rule_id) REFERENCES tax_rules(id),
  INDEX ix_plans_product_id (product_id)
) ENGINE=InnoDB;

CREATE TABLE subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  number VARCHAR(32) NOT NULL UNIQUE,
  customer_id INT NOT NULL,
  plan_id INT NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'draft',
  start_date DATE NOT NULL,
  expiry_date DATE,
  quote_valid_until DATE,
  quote_valid_until DATE,
  next_billing_date DATE,
  paused_at DATE,
  closed_at DATE,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  tax_rate DECIMAL(6,3) NOT NULL DEFAULT 0,
  variant_id INT,
  payment_terms_days INT NOT NULL DEFAULT 7,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_subscription_customer FOREIGN KEY (customer_id) REFERENCES users(id),
  CONSTRAINT fk_subscription_plan FOREIGN KEY (plan_id) REFERENCES plans(id),
  CONSTRAINT fk_subscription_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id),
  INDEX ix_subscriptions_customer_id (customer_id),
  INDEX ix_subscriptions_status (status)
) ENGINE=InnoDB;

CREATE TABLE quote_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  plan_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  valid_days INT NOT NULL DEFAULT 14,
  created_by INT,
  CONSTRAINT fk_quote_plan FOREIGN KEY (plan_id) REFERENCES plans(id),
  CONSTRAINT fk_quote_creator FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE discounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  kind VARCHAR(12) NOT NULL,
  value DECIMAL(12,2) NOT NULL,
  minimum_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  minimum_quantity INT NOT NULL DEFAULT 1,
  starts_on DATE,
  ends_on DATE,
  usage_limit INT,
  used_count INT NOT NULL DEFAULT 0,
  product_id INT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_discount_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

CREATE TABLE invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  number VARCHAR(32) NOT NULL UNIQUE,
  subscription_id INT NOT NULL,
  customer_id INT NOT NULL,
  billing_period VARCHAR(20) NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(12) NOT NULL DEFAULT 'draft',
  discount_id INT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_invoice_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id),
  CONSTRAINT fk_invoice_customer FOREIGN KEY (customer_id) REFERENCES users(id),
  CONSTRAINT fk_invoice_discount FOREIGN KEY (discount_id) REFERENCES discounts(id),
  CONSTRAINT uq_invoice_billing_period UNIQUE (subscription_id, billing_period),
  INDEX ix_invoices_subscription_id (subscription_id),
  INDEX ix_invoices_customer_id (customer_id),
  INDEX ix_invoices_status (status)
) ENGINE=InnoDB;

CREATE TABLE invoice_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL,
  description VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  tax_rate DECIMAL(6,3) NOT NULL,
  line_total DECIMAL(12,2) NOT NULL,
  CONSTRAINT fk_invoice_item_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  INDEX ix_invoice_items_invoice_id (invoice_id)
) ENGINE=InnoDB;

CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL,
  method VARCHAR(40) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  paid_on DATE NOT NULL,
  note TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payment_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id),
  INDEX ix_payments_invoice_id (invoice_id)
) ENGINE=InnoDB;

CREATE TABLE password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_reset_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;
