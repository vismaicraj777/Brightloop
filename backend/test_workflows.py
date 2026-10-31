"""End-to-end API checks. Run with: python -m unittest backend.test_workflows"""

import os
import unittest

os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["SECRET_KEY"] = "test-secret-key-only"

from werkzeug.security import generate_password_hash

from backend.app import (Base, User, app, engine, get_db)
from backend.db import SessionLocal


class BrightloopWorkflowTests(unittest.TestCase):
    def setUp(self):
        SessionLocal.remove()
        Base.metadata.drop_all(engine)
        Base.metadata.create_all(engine)
        app.config.update(TESTING=True, SECRET_KEY="test-secret-key-only")
        with app.app_context():
            get_db().add(User(name="Test Admin", email="admin@example.test",
                              password_hash=generate_password_hash("AdminPass2026!"), role="admin"))
            get_db().commit()
        self.admin = app.test_client()
        login = self.admin.post("/api/login", json={"email": "admin@example.test", "password": "AdminPass2026!"})
        self.assertEqual(login.status_code, 200, login.get_json())
        self.admin_csrf = login.get_json()["csrf"]

    def tearDown(self):
        SessionLocal.remove()

    def post(self, client, csrf, path, payload=None):
        return client.post(path, json=payload or {}, headers={"X-CSRF-Token": csrf})

    def test_customer_signup_and_role_isolation(self):
        customer_client = app.test_client()
        response = customer_client.post("/api/register", json={
            "name": "Asha Customer", "email": "asha@example.test", "password": "CustomerPass2026!"
        })
        self.assertEqual(response.status_code, 201, response.get_json())
        csrf = response.get_json()["csrf"]
        forbidden = customer_client.get("/api/dashboard")
        self.assertEqual(forbidden.status_code, 403)
        self.assertEqual(self.post(customer_client, csrf, "/api/staff", {"name": "No", "email": "no@example.test", "password": "AnotherPass2026!"}).status_code, 403)

    def test_subscription_invoice_and_partial_payment_lifecycle(self):
        product_response = self.post(self.admin, self.admin_csrf, "/api/products", {
            "name": "LoopDesk", "sales_price": 100, "cost_price": 20, "product_type": "software"
        })
        self.assertEqual(product_response.status_code, 201, product_response.get_json())
        product_id = product_response.get_json()["id"]
        tax_response = self.post(self.admin, self.admin_csrf, "/api/taxes", {"name": "GST", "rate": 18})
        self.assertEqual(tax_response.status_code, 201, tax_response.get_json())
        plan_response = self.post(self.admin, self.admin_csrf, "/api/plans", {
            "product_id": product_id, "name": "Monthly", "price": 100,
            "billing_frequency": "monthly", "min_quantity": 1,
            "tax_rule_id": tax_response.get_json()["id"]
        })
        self.assertEqual(plan_response.status_code, 201, plan_response.get_json())

        customer_client = app.test_client()
        signup = customer_client.post("/api/register", json={
            "name": "Asha Customer", "email": "asha@example.test", "password": "CustomerPass2026!"
        })
        self.assertEqual(signup.status_code, 201, signup.get_json())
        customer_csrf = signup.get_json()["csrf"]
        sub_response = self.post(customer_client, customer_csrf, "/api/subscriptions", {
            "plan_id": plan_response.get_json()["id"], "quantity": 2
        })
        self.assertEqual(sub_response.status_code, 201, sub_response.get_json())
        sub_id = sub_response.get_json()["subscription"]["id"]

        for status in ["quotation", "confirmed", "active"]:
            response = self.admin.put(f"/api/subscriptions/{sub_id}/status", json={"status": status}, headers={"X-CSRF-Token": self.admin_csrf})
            self.assertEqual(response.status_code, 200, response.get_json())
        invoice_response = self.post(self.admin, self.admin_csrf, f"/api/subscriptions/{sub_id}/invoice")
        self.assertEqual(invoice_response.status_code, 201, invoice_response.get_json())
        invoice = invoice_response.get_json()["invoice"]
        self.assertEqual(invoice["status"], "draft")
        self.assertEqual(invoice["total_amount"], 236.0)
        duplicate = self.post(self.admin, self.admin_csrf, f"/api/subscriptions/{sub_id}/invoice")
        self.assertEqual(duplicate.status_code, 409)

        confirmed = self.post(self.admin, self.admin_csrf, f"/api/invoices/{invoice['id']}/confirm")
        self.assertEqual(confirmed.status_code, 200, confirmed.get_json())
        first = self.post(self.admin, self.admin_csrf, "/api/payments", {"invoice_id": invoice["id"], "amount": 100, "method": "UPI"})
        self.assertEqual(first.status_code, 201, first.get_json())
        self.assertEqual(first.get_json()["remaining"], 136.0)
        second = self.post(self.admin, self.admin_csrf, "/api/payments", {"invoice_id": invoice["id"], "amount": 136, "method": "Bank transfer"})
        self.assertEqual(second.status_code, 201, second.get_json())
        self.assertEqual(second.get_json()["invoice_status"], "paid")


if __name__ == "__main__":
    unittest.main()
