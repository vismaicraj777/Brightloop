
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
