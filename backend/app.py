import uuid
from datetime import date, timedelta
from werkzeug.security import generate_password_hash
import re
from flask import Flask, jsonify, request
from db import get_db_connection

app = Flask(__name__)


@app.route("/")
def home():
    return jsonify({
        "message": "Brightloop Subscription Management API is running!"
    })


@app.route("/api/products", methods=["GET"])
def get_products():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM products")
    products = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(products)


@app.route("/api/plans", methods=["GET"])
def get_plans():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM plans")
    plans = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(plans)

@app.route("/api/products", methods=["POST"])
def create_product():
    data = request.get_json()

    required = ["name", "sales_price", "cost_price"]

    if not data or not all(key in data for key in required):
        return jsonify({"error": "Missing required fields"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        sql = """
            INSERT INTO products
            (name, product_type, sales_price, cost_price, notes)
            VALUES (%s, %s, %s, %s, %s)
        """

        values = (
            data["name"],
            data.get("product_type"),
            data["sales_price"],
            data["cost_price"],
            data.get("notes")
        )

        cursor.execute(sql, values)
        conn.commit()

        return jsonify({
            "message": "Product created successfully",
            "product_id": cursor.lastrowid
        }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()

@app.route("/api/plans", methods=["POST"])
def create_plan():
    data = request.get_json()

    required = ["product_id", "plan_name", "price", "billing_frequency"]

    if not data or not all(key in data for key in required):
        return jsonify({"error": "Missing required fields"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        sql = """
            INSERT INTO plans
            (product_id, plan_name, price, billing_frequency, min_quantity)
            VALUES (%s, %s, %s, %s, %s)
        """

        values = (
            data["product_id"],
            data["plan_name"],
            data["price"],
            data["billing_frequency"],
            data.get("min_quantity", 1)
        )

        cursor.execute(sql, values)
        conn.commit()

        return jsonify({
            "message": "Plan created successfully",
            "plan_id": cursor.lastrowid
        }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        cursor.close()
        conn.close()

@app.route("/api/register", methods=["POST"])
def register_customer():
    data = request.get_json()

    if not data:
        return jsonify({"error": "JSON data required"}), 400

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not name or not email or not password:
        return jsonify({"error": "All fields are required"}), 400

    if len(password) <= 8:
        return jsonify({"error": "Password must be longer than 8 characters"}), 400

    if not re.search(r"[A-Z]", password):
        return jsonify({"error": "Password needs an uppercase letter"}), 400

    if not re.search(r"[a-z]", password):
        return jsonify({"error": "Password needs a lowercase letter"}), 400

    if not re.search(r"[^A-Za-z0-9]", password):
        return jsonify({"error": "Password needs a special character"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        password_hash = generate_password_hash(password)

        cursor.execute("""
            INSERT INTO users (name, email, password_hash, role)
            VALUES (%s, %s, %s, 'customer')
        """, (name, email, password_hash))

        conn.commit()

        return jsonify({
            "message": "Customer registered successfully",
            "user_id": cursor.lastrowid
        }), 201

    except Exception as e:
        conn.rollback()

        if "Duplicate entry" in str(e):
            return jsonify({"error": "Email already registered"}), 409

        return jsonify({"error": "Registration failed"}), 500

    finally:
        cursor.close()
        conn.close()
@app.route("/api/subscriptions", methods=["POST"])
def create_subscription():
    data = request.get_json()

    if not data:
        return jsonify({"error": "JSON data required"}), 400

    customer_id = data.get("customer_id")
    plan_id = data.get("plan_id")
    quantity = data.get("quantity", 1)

    if not customer_id or not plan_id or not isinstance(quantity, int) or quantity < 1:
        return jsonify({"error": "Invalid customer, plan or quantity"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Check that the customer exists
        cursor.execute(
            "SELECT user_id FROM users WHERE user_id = %s AND role = 'customer'",
            (customer_id,)
        )
        customer = cursor.fetchone()

        if not customer:
            return jsonify({"error": "Customer not found"}), 404

        # Get plan details
        cursor.execute(
            "SELECT * FROM plans WHERE plan_id = %s",
            (plan_id,)
        )
        plan = cursor.fetchone()

        if not plan:
            return jsonify({"error": "Plan not found"}), 404

        today = date.today()

        if plan["available_from"] and today < plan["available_from"]:
            return jsonify({"error": "Plan is not available yet"}), 400

        if plan["available_until"] and today > plan["available_until"]:
            return jsonify({"error": "Plan is no longer available"}), 400

        if quantity < plan["min_quantity"]:
            return jsonify({"error": "Quantity is below the plan minimum"}), 400

        # Calculate subscription amount
        unit_price = float(plan["price"])
        tax_rate = float(data.get("tax_rate", 0))
        subtotal = unit_price * quantity
        tax_amount = subtotal * tax_rate / 100
        total = subtotal + tax_amount

        subscription_number = "SUB-" + uuid.uuid4().hex[:8].upper()

        # Create subscription
        cursor.execute("""
            INSERT INTO subscriptions
            (subscription_number, customer_id, plan_id,
             start_date, expiry_date, status)
            VALUES (%s, %s, %s, %s, %s, 'draft')
        """, (
            subscription_number,
            customer_id,
            plan_id,
            today,
            data.get("expiry_date")
        ))

        subscription_id = cursor.lastrowid

        # Add its product item
        cursor.execute("""
            INSERT INTO subscription_items
            (subscription_id, product_id, quantity, unit_price,
             tax_rate, tax_amount, line_total)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            subscription_id,
            plan["product_id"],
            quantity,
            unit_price,
            tax_rate,
            tax_amount,
            total
        ))

        conn.commit()

        return jsonify({
            "message": "Subscription created successfully",
            "subscription_id": subscription_id,
            "subscription_number": subscription_number,
            "total_amount": round(total, 2),
            "status": "active"
        }), 201

    except Exception:
        conn.rollback()
        return jsonify({"error": "Could not create subscription"}), 500

    finally:
        cursor.close()
        conn.close()
@app.route("/api/subscriptions/<int:subscription_id>/invoice", methods=["POST"])
def generate_invoice(subscription_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            "SELECT * FROM subscriptions WHERE subscription_id = %s",
            (subscription_id,)
        )
        subscription = cursor.fetchone()

        if not subscription:
            return jsonify({"error": "Subscription not found"}), 404

        if subscription["status"] != "active":
            return jsonify({"error": "Subscription is not active"}), 400

        cursor.execute("""
            SELECT * FROM invoices
            WHERE subscription_id = %s
              AND YEAR(invoice_date) = YEAR(CURDATE())
              AND MONTH(invoice_date) = MONTH(CURDATE())
        """, (subscription_id,))

        if cursor.fetchone():
            return jsonify({"error": "Invoice already generated this month"}), 409

        cursor.execute("""
            SELECT * FROM subscription_items
            WHERE subscription_id = %s
        """, (subscription_id,))
        items = cursor.fetchall()

        if not items:
            return jsonify({"error": "No subscription items found"}), 400

        total = sum(float(item["line_total"]) for item in items)
        invoice_number = "INV-" + uuid.uuid4().hex[:8].upper()
        today = date.today()

        cursor.execute("""
            INSERT INTO invoices
            (subscription_id, invoice_number, invoice_date,
             due_date, total_amount, status)
            VALUES (%s, %s, %s, %s, %s, 'confirmed')
        """, (
            subscription_id,
            invoice_number,
            today,
            today + timedelta(days=7),
            total
        ))

        invoice_id = cursor.lastrowid

        for item in items:
            cursor.execute("""
                INSERT INTO invoice_items
                (invoice_id, product_id, description, quantity,
                 unit_price, tax_rate, tax_amount, line_total)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                invoice_id,
                item["product_id"],
                "Subscription product",
                item["quantity"],
                item["unit_price"],
                item["tax_rate"],
                item["tax_amount"],
                item["line_total"]
            ))

        conn.commit()

        return jsonify({
            "message": "Invoice generated successfully",
            "invoice_id": invoice_id,
            "invoice_number": invoice_number,
            "total_amount": round(total, 2),
            "status": "confirmed"
        }), 201

    except Exception:
        conn.rollback()
        return jsonify({"error": "Invoice generation failed"}), 500

    finally:
        cursor.close()
        conn.close()
@app.route("/api/payments", methods=["POST"])
def record_payment():
    data = request.get_json() or {}

    invoice_id = data.get("invoice_id")
    amount = data.get("amount")
    method = data.get("payment_method", "UPI")

    if not invoice_id or amount is None:
        return jsonify({"error": "Invoice ID and amount required"}), 400

    try:
        amount = float(amount)
        if amount <= 0:
            return jsonify({"error": "Amount must be positive"}), 400

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT * FROM invoices WHERE invoice_id = %s",
            (invoice_id,)
        )
        invoice = cursor.fetchone()

        if not invoice:
            return jsonify({"error": "Invoice not found"}), 404

        cursor.execute("""
            SELECT COALESCE(SUM(amount), 0) AS paid
            FROM payments WHERE invoice_id = %s
        """, (invoice_id,))
        paid = float(cursor.fetchone()["paid"])
        remaining = float(invoice["total_amount"]) - paid

        if amount > remaining:
            return jsonify({"error": "Payment exceeds remaining balance"}), 400

        cursor.execute("""
            INSERT INTO payments
            (invoice_id, payment_method, amount, payment_date, note)
            VALUES (%s, %s, %s, %s, %s)
        """, (invoice_id, method, amount, date.today(),
              data.get("note", "")))

        payment_id = cursor.lastrowid

        if paid + amount >= float(invoice["total_amount"]):
            cursor.execute(
                "UPDATE invoices SET status = 'paid' WHERE invoice_id = %s",
                (invoice_id,)
            )

        conn.commit()

        return jsonify({
            "message": "Payment recorded successfully",
            "payment_id": payment_id,
            "remaining_balance": round(remaining - amount, 2),
            "invoice_status": "paid" if paid + amount >= float(invoice["total_amount"]) else "confirmed"
        }), 201

    except Exception:
        if 'conn' in locals():
            conn.rollback()
        return jsonify({"error": "Payment recording failed"}), 500

    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()
@app.route("/api/dashboard", methods=["GET"])
def dashboard():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT COUNT(*) AS active_subscriptions
            FROM subscriptions
            WHERE status = 'active'
        """)
        active = cursor.fetchone()["active_subscriptions"]

        cursor.execute("""
            SELECT COALESCE(SUM(amount), 0) AS total_revenue
            FROM payments
        """)
        revenue = cursor.fetchone()["total_revenue"]

        cursor.execute("""
            SELECT COALESCE(SUM(
                invoices.total_amount - COALESCE(p.paid, 0)
            ), 0) AS total_owed
            FROM invoices
            LEFT JOIN (
                SELECT invoice_id, SUM(amount) AS paid
                FROM payments
                GROUP BY invoice_id
            ) p ON invoices.invoice_id = p.invoice_id
            WHERE invoices.status != 'paid'
        """)
        owed = cursor.fetchone()["total_owed"]

        cursor.execute("""
            SELECT COUNT(*) AS overdue_invoices
            FROM invoices
            WHERE due_date < CURDATE()
              AND status != 'paid'
        """)
        overdue = cursor.fetchone()["overdue_invoices"]

        return jsonify({
            "active_subscriptions": active,
            "total_revenue": float(revenue),
            "total_owed": float(owed),
            "overdue_invoices": overdue
        })

    except Exception:
        return jsonify({"error": "Dashboard data unavailable"}), 500

    finally:
        cursor.close()
        conn.close()
@app.route("/api/subscriptions/<int:subscription_id>/status", methods=["PUT"])
def update_subscription_status(subscription_id):
    data = request.get_json() or {}
    new_status = data.get("status")

    allowed_transitions = {
        "draft": ["quotation"],
        "quotation": ["confirmed"],
        "confirmed": ["active"],
        "active": ["closed"],
        "closed": []
    }

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            "SELECT status FROM subscriptions WHERE subscription_id = %s",
            (subscription_id,)
        )
        subscription = cursor.fetchone()

        if not subscription:
            return jsonify({"error": "Subscription not found"}), 404

        current_status = subscription["status"]

        if new_status not in allowed_transitions.get(current_status, []):
            return jsonify({
                "error": "Invalid status transition",
                "current_status": current_status
            }), 400

        cursor.execute(
            "UPDATE subscriptions SET status = %s WHERE subscription_id = %s",
            (new_status, subscription_id)
        )
        conn.commit()

        return jsonify({
            "message": "Subscription status updated",
            "subscription_id": subscription_id,
            "old_status": current_status,
            "new_status": new_status
        }), 200

    except Exception:
        conn.rollback()
        return jsonify({"error": "Status update failed"}), 500

    finally:
        cursor.close()
        conn.close()
@app.route("/api/subscriptions/<int:subscription_id>/pause", methods=["PUT"])
def pause_subscription(subscription_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            "SELECT status FROM subscriptions WHERE subscription_id = %s",
            (subscription_id,)
        )
        subscription = cursor.fetchone()

        if not subscription:
            return jsonify({"error": "Subscription not found"}), 404

        if subscription["status"] != "active":
            return jsonify({"error": "Only active subscriptions can be paused"}), 400

        cursor.execute(
            "UPDATE subscriptions SET status = 'paused' WHERE subscription_id = %s",
            (subscription_id,)
        )
        conn.commit()

        return jsonify({"message": "Subscription paused successfully"}), 200

    except Exception:
        conn.rollback()
        return jsonify({"error": "Pause failed"}), 500

    finally:
        cursor.close()
        conn.close()
@app.route("/api/subscriptions/<int:subscription_id>/resume", methods=["PUT"])
def resume_subscription(subscription_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            "SELECT status FROM subscriptions WHERE subscription_id = %s",
            (subscription_id,)
        )
        subscription = cursor.fetchone()

        if not subscription:
            return jsonify({"error": "Subscription not found"}), 404

        if subscription["status"] != "paused":
            return jsonify({"error": "Only paused subscriptions can be resumed"}), 400

        cursor.execute(
            "UPDATE subscriptions SET status = 'active' WHERE subscription_id = %s",
            (subscription_id,)
        )
        conn.commit()

        return jsonify({"message": "Subscription resumed successfully"}), 200

    except Exception:
        conn.rollback()
        return jsonify({"error": "Resume failed"}), 500

    finally:
        cursor.close()
        conn.close()
@app.route("/api/subscriptions/<int:subscription_id>/renew", methods=["POST"])
def renew_subscription(subscription_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            "SELECT customer_id, plan_id, status FROM subscriptions WHERE subscription_id = %s",
            (subscription_id,)
        )
        old_subscription = cursor.fetchone()

        if not old_subscription:
            return jsonify({"error": "Subscription not found"}), 404

        if old_subscription["status"] != "closed":
            return jsonify({"error": "Only closed subscriptions can be renewed"}), 400

        new_number = "SUB-" + uuid.uuid4().hex[:8].upper()

        cursor.execute(
            """
            INSERT INTO subscriptions
            (subscription_number, customer_id, plan_id, start_date, status)
            VALUES (%s, %s, %s, %s, 'draft')
            """,
            (
                new_number,
                old_subscription["customer_id"],
                old_subscription["plan_id"],
                date.today()
            )
        )

        conn.commit()
        new_id = cursor.lastrowid

        return jsonify({
            "message": "Subscription renewed successfully",
            "new_subscription_id": new_id,
            "status": "draft"
        }), 201

    except Exception:
        conn.rollback()
        return jsonify({"error": "Renewal failed"}), 500

    finally:
        cursor.close()
        conn.close()
@app.route("/api/subscriptions/<int:subscription_id>/early-close", methods=["PUT"])
def early_close_subscription(subscription_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            "SELECT status FROM subscriptions WHERE subscription_id = %s",
            (subscription_id,)
        )
        subscription = cursor.fetchone()

        if not subscription:
            return jsonify({"error": "Subscription not found"}), 404

        if subscription["status"] != "active":
            return jsonify({"error": "Only active subscriptions can be closed early"}), 400

        cursor.execute(
            """
            UPDATE subscriptions
            SET status = 'closed', closed_at = %s
            WHERE subscription_id = %s
            """,
            (date.today(), subscription_id)
        )
        conn.commit()

        return jsonify({
            "message": "Subscription closed early successfully",
            "subscription_id": subscription_id,
            "closed_at": str(date.today()),
            "status": "closed"
        }), 200

    except Exception:
        conn.rollback()
        return jsonify({"error": "Early closure failed"}), 500

    finally:
        cursor.close()
        conn.close()
@app.route("/api/variants", methods=["POST"])
def add_variant():
    data = request.get_json() or {}

    product_id = data.get("product_id")
    variant_name = data.get("variant_name")
    additional_price = data.get("additional_price", 0)

    if not product_id or not variant_name:
        return jsonify({"error": "Product ID and variant name are required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            "SELECT product_id FROM products WHERE product_id = %s",
            (product_id,)
        )

        if not cursor.fetchone():
            return jsonify({"error": "Product not found"}), 404

        cursor.execute(
            """
            INSERT INTO product_variants
            (product_id, variant_name, additional_price)
            VALUES (%s, %s, %s)
            """,
            (product_id, variant_name, additional_price)
        )

        conn.commit()

        return jsonify({
            "message": "Variant added successfully",
            "variant_id": cursor.lastrowid
        }), 201

    except Exception:
        conn.rollback()
        return jsonify({"error": "Could not add variant"}), 500

    finally:
        cursor.close()
        conn.close()
@app.route("/api/variants/<int:product_id>", methods=["GET"])
def get_variants(product_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT variant_id, product_id, variant_name, additional_price
            FROM product_variants
            WHERE product_id = %s
            """,
            (product_id,)
        )

        variants = cursor.fetchall()

        return jsonify(variants), 200

    except Exception:
        return jsonify({"error": "Could not retrieve variants"}), 500

    finally:
        cursor.close()
        conn.close()
@app.route("/api/customers", methods=["GET"])
def get_customers():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT user_id, name, email
            FROM users
            WHERE role = 'customer'
        """)
        customers = cursor.fetchall()
        return jsonify(customers), 200

    except Exception:
        return jsonify({"error": "Could not retrieve customers"}), 500

    finally:
        cursor.close()
        conn.close()
@app.route("/api/subscriptions/auto-close", methods=["POST"])
def auto_close_subscriptions():
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            UPDATE subscriptions s
            JOIN plans p ON s.plan_id = p.plan_id
            SET
                s.status = 'closed',
                s.closed_at = CURDATE()
            WHERE
                s.status = 'active'
                AND s.expiry_date IS NOT NULL
                AND s.expiry_date <= CURDATE()
                AND p.auto_close = TRUE
        """)

        closed_count = cursor.rowcount
        conn.commit()

        return jsonify({
            "message": "Auto-close completed",
            "subscriptions_closed": closed_count
        }), 200

    except Exception:
        conn.rollback()
        return jsonify({"error": "Auto-close failed"}), 500

    finally:
        cursor.close()
        conn.close()
if __name__ == "__main__":
    app.run(debug=True)
