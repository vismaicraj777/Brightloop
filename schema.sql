
CREATE DATABASE IF NOT EXISTS brightloop_db;

USE brightloop_db;

-- 1. Users: Admin, staff and customers
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'staff', 'customer') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Products sold by Brightloop
CREATE TABLE products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    product_type VARCHAR(100),
    sales_price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2) NOT NULL,
    notes TEXT
);

-- 3. Subscription plans
CREATE TABLE plans (
    plan_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    plan_name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    billing_frequency ENUM(
        'daily', 'weekly', 'monthly', 'yearly'
    ) NOT NULL,
    min_quantity INT DEFAULT 1,
    available_from DATE,
    available_until DATE,
    auto_close BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (product_id)
        REFERENCES products(product_id)
);

-- 4. Subscriptions
CREATE TABLE subscriptions (
    subscription_id INT AUTO_INCREMENT PRIMARY KEY,
    subscription_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT NOT NULL,
    plan_id INT NOT NULL,
    start_date DATE NOT NULL,
    expiry_date DATE,
    status ENUM(
        'draft', 'quotation', 'confirmed',
        'active', 'closed'
    ) DEFAULT 'draft',

    FOREIGN KEY (customer_id)
        REFERENCES users(user_id),

    FOREIGN KEY (plan_id)
        REFERENCES plans(plan_id)
);

-- 5. Invoices
CREATE TABLE invoices (
    invoice_id INT AUTO_INCREMENT PRIMARY KEY,
    subscription_id INT NOT NULL,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('draft', 'confirmed', 'paid')
        DEFAULT 'draft',

    FOREIGN KEY (subscription_id)
        REFERENCES subscriptions(subscription_id)
);

-- 6. Payments
CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    payment_method VARCHAR(50),
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    note TEXT,

    FOREIGN KEY (invoice_id)
        REFERENCES invoices(invoice_id)
);
CREATE TABLE subscription_items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    subscription_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    line_total DECIMAL(10,2) NOT NULL,

    FOREIGN KEY (subscription_id)
        REFERENCES subscriptions(subscription_id),

    FOREIGN KEY (product_id)
        REFERENCES products(product_id)
);CREATE TABLE invoice_items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    product_id INT NOT NULL,
    description VARCHAR(255),
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    line_total DECIMAL(10,2) NOT NULL,

    FOREIGN KEY (invoice_id)
        REFERENCES invoices(invoice_id),

    FOREIGN KEY (product_id)
        REFERENCES products(product_id)
);