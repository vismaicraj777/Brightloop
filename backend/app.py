"""Brightloop: a small, complete subscription operations app."""

from __future__ import annotations

import hashlib
import calendar
import os
import re
import secrets
from datetime import date, datetime, timedelta
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from functools import wraps
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request, session
from sqlalchemy import (Boolean, Column, Date, DateTime, ForeignKey, Integer, Numeric,
                        String, Text, UniqueConstraint, func, select)
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from werkzeug.exceptions import HTTPException
from werkzeug.security import check_password_hash, generate_password_hash

HERE = Path(__file__).resolve().parent
load_dotenv(HERE.parent / ".env")

from .db import Base, close_db, engine, get_db


app = Flask(__name__, template_folder="../templates", static_folder="../static")
app.config.update(
    SECRET_KEY=os.getenv("SECRET_KEY") or secrets.token_hex(32),
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=os.getenv("COOKIE_SECURE", "false").lower() == "true",
    MAX_CONTENT_LENGTH=1024 * 1024,
)


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    email = Column(String(254), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="customer")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True)
    name = Column(String(150), nullable=False)
    product_type = Column(String(80), nullable=False, default="software")
    sales_price = Column(Numeric(12, 2), nullable=False)
    cost_price = Column(Numeric(12, 2), nullable=False, default=0)
    notes = Column(Text)
    active = Column(Boolean, nullable=False, default=True)


class Variant(Base):
    __tablename__ = "product_variants"
    id = Column(Integer, primary_key=True)
    product_id = Column(ForeignKey("products.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    additional_price = Column(Numeric(12, 2), nullable=False, default=0)
    __table_args__ = (UniqueConstraint("product_id", "name", name="uq_variant_product_name"),)


class Plan(Base):
    __tablename__ = "plans"
    id = Column(Integer, primary_key=True)
    product_id = Column(ForeignKey("products.id"), nullable=False, index=True)
    name = Column(String(120), nullable=False)
    price = Column(Numeric(12, 2), nullable=False)
    billing_frequency = Column(String(12), nullable=False)
    tax_rate = Column(Numeric(6, 3), nullable=False, default=0)
    tax_rule_id = Column(ForeignKey("tax_rules.id"))
    min_quantity = Column(Integer, nullable=False, default=1)
    available_from = Column(Date)
    available_until = Column(Date)
    auto_close = Column(Boolean, nullable=False, default=False)
    allow_early_close = Column(Boolean, nullable=False, default=True)
    active = Column(Boolean, nullable=False, default=True)


class TaxRule(Base):
    __tablename__ = "tax_rules"
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    rate = Column(Numeric(6, 3), nullable=False)
    active = Column(Boolean, nullable=False, default=True)


class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(Integer, primary_key=True)
    number = Column(String(32), unique=True, nullable=False)
    customer_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    plan_id = Column(ForeignKey("plans.id"), nullable=False)
    status = Column(String(16), nullable=False, default="draft", index=True)
    start_date = Column(Date, nullable=False)
    expiry_date = Column(Date)
    quote_valid_until = Column(Date)
    next_billing_date = Column(Date)
    paused_at = Column(Date)
    closed_at = Column(Date)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Numeric(12, 2), nullable=False)
    tax_rate = Column(Numeric(6, 3), nullable=False, default=0)
    variant_id = Column(ForeignKey("product_variants.id"))
    payment_terms_days = Column(Integer, nullable=False, default=7)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class QuoteTemplate(Base):
    __tablename__ = "quote_templates"
    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False, unique=True)
    plan_id = Column(ForeignKey("plans.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    valid_days = Column(Integer, nullable=False, default=14)
    created_by = Column(ForeignKey("users.id"))


class Discount(Base):
    __tablename__ = "discounts"
    id = Column(Integer, primary_key=True)
    code = Column(String(40), unique=True, nullable=False)
    name = Column(String(120), nullable=False)
    kind = Column(String(12), nullable=False)
    value = Column(Numeric(12, 2), nullable=False)
    minimum_amount = Column(Numeric(12, 2), nullable=False, default=0)
    minimum_quantity = Column(Integer, nullable=False, default=1)
    starts_on = Column(Date)
    ends_on = Column(Date)
    usage_limit = Column(Integer)
    used_count = Column(Integer, nullable=False, default=0)
    product_id = Column(ForeignKey("products.id"))
    active = Column(Boolean, nullable=False, default=True)


class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(Integer, primary_key=True)
    number = Column(String(32), unique=True, nullable=False)
    subscription_id = Column(ForeignKey("subscriptions.id"), nullable=False, index=True)
    customer_id = Column(ForeignKey("users.id"), nullable=False, index=True)
    billing_period = Column(String(20), nullable=False)
    invoice_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False)
    subtotal = Column(Numeric(12, 2), nullable=False)
    discount_amount = Column(Numeric(12, 2), nullable=False, default=0)
    tax_amount = Column(Numeric(12, 2), nullable=False, default=0)
    total_amount = Column(Numeric(12, 2), nullable=False)
    status = Column(String(12), nullable=False, default="draft", index=True)
    discount_id = Column(ForeignKey("discounts.id"))
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    __table_args__ = (UniqueConstraint("subscription_id", "billing_period", name="uq_invoice_billing_period"),)


class InvoiceLine(Base):
    __tablename__ = "invoice_items"
    id = Column(Integer, primary_key=True)
    invoice_id = Column(ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    description = Column(String(255), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)
    tax_rate = Column(Numeric(6, 3), nullable=False)
    line_total = Column(Numeric(12, 2), nullable=False)


class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True)
    invoice_id = Column(ForeignKey("invoices.id"), nullable=False, index=True)
    method = Column(String(40), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    paid_on = Column(Date, nullable=False)
    note = Column(Text)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class PasswordReset(Base):
    __tablename__ = "password_resets"
    id = Column(Integer, primary_key=True)
    user_id = Column(ForeignKey("users.id"), nullable=False)
    token_hash = Column(String(64), nullable=False, unique=True)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, nullable=False, default=False)


Base.metadata.create_all(bind=engine)
app.teardown_appcontext(close_db)


def money(value) -> Decimal:
    try:
        amount = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        raise ValueError("Enter a valid amount.")
    if not amount.is_finite() or amount < 0 or amount > Decimal("999999999.99"):
        raise ValueError("Amount must be between 0 and 999,999,999.99.")
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def decimal_value(value, field):
    try:
        number=Decimal(str(value))
    except (InvalidOperation,TypeError,ValueError):
        raise ValueError(f"{field} must be a valid number.")
    if not number.is_finite(): raise ValueError(f"{field} must be a valid number.")
    return number


def iso(d):
    return d.isoformat() if d else None


def user_payload(user):
    return {"id": user.id, "name": user.name, "email": user.email, "role": user.role}


def require_login(fn):
    @wraps(fn)
    def wrapped(*args, **kwargs):
        uid = session.get("user_id")
        if not uid:
            return jsonify(error="Please sign in to continue."), 401
        db = get_db()
        user = db.get(User, uid)
        if not user:
            session.clear()
            return jsonify(error="Your session expired. Please sign in again."), 401
        request.current_user = user
        return fn(*args, **kwargs)
    return wrapped


def roles(*allowed):
    def decorator(fn):
        @wraps(fn)
        @require_login
        def wrapped(*args, **kwargs):
            if request.current_user.role not in allowed:
                return jsonify(error="You do not have permission to do that."), 403
            return fn(*args, **kwargs)
        return wrapped
    return decorator


@app.before_request
def csrf_guard():
    if request.method in {"POST", "PUT", "PATCH", "DELETE"} and session.get("user_id") and request.path != "/api/password-reset/complete":
        expected = session.get("csrf")
        supplied = request.headers.get("X-CSRF-Token")
        if not expected or not secrets.compare_digest(expected, supplied or ""):
            return jsonify(error="Refresh the page and try again."), 400


def body():
    value = request.get_json(silent=True)
    if not isinstance(value, dict):
        raise ValueError("Send a JSON object.")
    return value


def parse_date(value, field, optional=False):
    if value in (None, "") and optional:
        return None
    try:
        return date.fromisoformat(str(value))
    except (TypeError, ValueError):
        raise ValueError(f"{field} must be a date in YYYY-MM-DD format.")


def bool_value(value, field, default=False):
    if value is None: return default
    if not isinstance(value, bool): raise ValueError(f"{field} must be true or false.")
    return value


def validate_password(password):
    if len(password) <= 8 or not re.search(r"[A-Z]", password) or not re.search(r"[a-z]", password) or not re.search(r"[^A-Za-z0-9]", password):
        raise ValueError("Use at least 9 characters with uppercase, lowercase and a special character.")


def can_view_customer(user, customer_id):
    return user.role in {"admin", "staff"} or user.id == customer_id


def can_manage_subscription(user, subscription):
    return user.role in {"admin", "staff"} or (user.role == "customer" and user.id == subscription.customer_id)


def next_date(start: date, frequency: str) -> date:
    if frequency == "daily":
        return start + timedelta(days=1)
    if frequency == "weekly":
        return start + timedelta(days=7)
    if frequency == "monthly":
        month = start.month % 12 + 1
        year = start.year + (start.month == 12)
        current_last = start.day == calendar.monthrange(start.year, start.month)[1]
        last_day = calendar.monthrange(year, month)[1]
        day = last_day if current_last else min(start.day, last_day)
        return date(year, month, day)
    year = start.year + 1
    return date(year, start.month, min(start.day, calendar.monthrange(year, start.month)[1]))


def subscription_json(db, sub):
    customer, plan = db.get(User, sub.customer_id), db.get(Plan, sub.plan_id)
    product = db.get(Product, plan.product_id) if plan else None
    return {"id": sub.id, "number": sub.number, "customer_id": sub.customer_id,
            "customer_name": customer.name if customer else "", "customer_email": customer.email if customer else "",
            "plan_id": sub.plan_id, "plan_name": plan.name if plan else "", "product_name": product.name if product else "",
            "status": sub.status, "start_date": iso(sub.start_date), "expiry_date": iso(sub.expiry_date), "quote_valid_until": iso(sub.quote_valid_until), "paused_at": iso(sub.paused_at),
            "allow_early_close": bool(plan.allow_early_close) if plan else False,
            "next_billing_date": iso(sub.next_billing_date), "quantity": sub.quantity,
            "unit_price": float(sub.unit_price), "tax_rate": float(sub.tax_rate), "total": float(money(sub.unit_price * sub.quantity * (1 + sub.tax_rate / 100))),
            "payment_terms_days": sub.payment_terms_days}


def invoice_json(db, invoice, paid_amount=None):
    customer = db.get(User, invoice.customer_id)
    paid = paid_amount if paid_amount is not None else (db.scalar(select(func.coalesce(func.sum(Payment.amount), 0)).where(Payment.invoice_id == invoice.id)) or 0)
    return {"id": invoice.id, "number": invoice.number, "subscription_id": invoice.subscription_id,
            "customer_id": invoice.customer_id, "customer_name": customer.name if customer else "",
            "billing_period": invoice.billing_period, "invoice_date": iso(invoice.invoice_date), "due_date": iso(invoice.due_date),
            "subtotal": float(invoice.subtotal), "discount_amount": float(invoice.discount_amount),
            "tax_amount": float(invoice.tax_amount), "total_amount": float(invoice.total_amount),
            "paid_amount": float(paid), "balance": float(money(invoice.total_amount - Decimal(str(paid)))) if invoice.status!="cancelled" else 0,
            "status": invoice.status, "overdue": invoice.due_date < date.today() and invoice.status not in {"paid","cancelled"}}


@app.errorhandler(ValueError)
def bad_input(error):
    return jsonify(error=str(error)), 400


@app.errorhandler(IntegrityError)
def duplicate_or_constraint(_error):
    get_db().rollback()
    return jsonify(error="That record conflicts with an existing record. Check for duplicate names or emails."), 409


@app.errorhandler(SQLAlchemyError)
def database_error(error):
    app.logger.exception("Database operation failed", exc_info=error)
    get_db().rollback()
    return jsonify(error="Brightloop could not save or load that record. Check the database connection and try again."), 503


@app.errorhandler(Exception)
def unexpected_error(error):
    if isinstance(error,HTTPException): return error
    app.logger.exception("Unexpected application error",exc_info=error)
    get_db().rollback()
    return jsonify(error="Brightloop could not complete that request. Check the input and try again."),500


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/api/health")
def health():
    get_db().execute(select(1))
    return jsonify(status="ok", app="Brightloop", database="connected")


@app.post("/api/register")
def register():
    data = body(); name = str(data.get("name", "")).strip(); email = str(data.get("email", "")).strip().lower(); password = str(data.get("password", ""))
    validate_password(password)
    if not name or len(name) > 120 or not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
        raise ValueError("Enter your name and a valid email address.")
    db = get_db(); user = User(name=name, email=email, password_hash=generate_password_hash(password), role="customer")
    db.add(user); db.commit(); session["user_id"] = user.id; session["csrf"] = secrets.token_urlsafe(24)
    return jsonify(user=user_payload(user), csrf=session["csrf"]), 201


@app.post("/api/login")
def login():
    data = body(); email = str(data.get("email", "")).strip().lower(); password = str(data.get("password", ""))
    user = get_db().scalar(select(User).where(User.email == email))
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify(error="Email or password is incorrect."), 401
    session.clear(); session["user_id"] = user.id; session["csrf"] = secrets.token_urlsafe(24)
    return jsonify(user=user_payload(user), csrf=session["csrf"])


@app.post("/api/logout")
@require_login
def logout():
    session.clear(); return jsonify(message="Signed out.")


@app.get("/api/me")
@require_login
def me():
    return jsonify(user=user_payload(request.current_user), csrf=session["csrf"])


@app.post("/api/password-reset/request")
def password_reset_request():
    data = body(); email = str(data.get("email", "")).strip().lower()
    user = get_db().scalar(select(User).where(User.email == email))
    result = {"message": "If that email has an account, password reset instructions have been created."}
    if user and os.getenv("RESET_LINK_MODE", "demo").lower() == "demo":
        token = secrets.token_urlsafe(32); db = get_db()
        db.add(PasswordReset(user_id=user.id, token_hash=hashlib.sha256(token.encode()).hexdigest(), expires_at=datetime.utcnow()+timedelta(minutes=30)))
        db.commit(); result["demo_reset_url"] = f"{request.host_url.rstrip('/')}/?reset={token}"
    return jsonify(result)


@app.post("/api/password-reset/complete")
def password_reset_complete():
    data = body(); token = str(data.get("token", "")); password = str(data.get("password", "")); validate_password(password)
    reset = get_db().scalar(select(PasswordReset).where(PasswordReset.token_hash == hashlib.sha256(token.encode()).hexdigest(), PasswordReset.used.is_(False)))
    if not reset or reset.expires_at < datetime.utcnow():
        return jsonify(error="This reset link is invalid or has expired."), 400
    user = get_db().get(User, reset.user_id); user.password_hash = generate_password_hash(password); reset.used = True; get_db().commit(); session.clear()
    return jsonify(message="Password updated. You can now sign in.")


@app.get("/api/users")
@roles("admin")
def list_users():
    users = get_db().scalars(select(User).order_by(User.created_at.desc())).all()
    return jsonify([user_payload(u) | {"created_at": u.created_at.isoformat()} for u in users])


@app.post("/api/staff")
@roles("admin")
def create_staff():
    data = body(); name = str(data.get("name", "")).strip(); email = str(data.get("email", "")).strip().lower(); password = str(data.get("password", "")); validate_password(password)
    if not name or not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email): raise ValueError("Enter a name and valid email.")
    user = User(name=name, email=email, password_hash=generate_password_hash(password), role="staff"); db=get_db(); db.add(user); db.commit()
    return jsonify(user=user_payload(user)), 201


@app.get("/api/customers")
@roles("admin", "staff")
def customers():
    return jsonify([user_payload(u) for u in get_db().scalars(select(User).where(User.role == "customer").order_by(User.name)).all()])


@app.get("/api/products")
@require_login
def products():
    db=get_db(); rows=db.scalars(select(Product).where(Product.active.is_(True)).order_by(Product.name)).all()
    result=[]
    for p in rows:
        item={"id":p.id,"name":p.name,"product_type":p.product_type,"sales_price":float(p.sales_price),
              "variants":[{"id":v.id,"name":v.name,"additional_price":float(v.additional_price)} for v in db.scalars(select(Variant).where(Variant.product_id==p.id)).all()]}
        if request.current_user.role in {"admin","staff"}: item.update(cost_price=float(p.cost_price),notes=p.notes)
        result.append(item)
    return jsonify(result)


@app.post("/api/products")
@roles("admin")
def product_create():
    data=body(); name=str(data.get("name","")).strip()
    if not name: raise ValueError("Product name is required.")
    db=get_db(); p=Product(name=name,product_type=str(data.get("product_type","software"))[:80],sales_price=money(data.get("sales_price")),cost_price=money(data.get("cost_price",0)),notes=str(data.get("notes", ""))[:4000]); db.add(p); db.flush()
    for item in data.get("variants",[]):
        if str(item.get("name","")).strip(): db.add(Variant(product_id=p.id,name=str(item["name"]).strip(),additional_price=money(item.get("additional_price",0))))
    db.commit(); return jsonify(id=p.id,message="Product created."),201


@app.get("/api/plans")
@require_login
def plans():
    db=get_db(); return jsonify([{"id":p.id,"product_id":p.product_id,"product_name":db.get(Product,p.product_id).name,"name":p.name,"price":float(p.price),"tax_rate":float(p.tax_rate),"tax_rule_id":p.tax_rule_id,"tax_rule_name":db.get(TaxRule,p.tax_rule_id).name if p.tax_rule_id else "No tax","billing_frequency":p.billing_frequency,"min_quantity":p.min_quantity,"available_from":iso(p.available_from),"available_until":iso(p.available_until),"auto_close":p.auto_close,"allow_early_close":p.allow_early_close} for p in db.scalars(select(Plan).where(Plan.active.is_(True)).order_by(Plan.id.desc())).all()])


@app.post("/api/plans")
@roles("admin")
def plan_create():
    d=body(); freq=d.get("billing_frequency"); qty=int(d.get("min_quantity",1))
    if freq not in {"daily","weekly","monthly","yearly"}: raise ValueError("Choose a valid billing frequency.")
    if qty<1 or qty>100000: raise ValueError("Minimum quantity must be at least 1.")
    start=parse_date(d.get("available_from"),"Start date",True); end=parse_date(d.get("available_until"),"End date",True)
    if start and end and end<start: raise ValueError("Plan end date must be after its start date.")
    db=get_db(); product_id=int(d["product_id"])
    if not db.get(Product,product_id): return jsonify(error="Product not found."),404
    tax_rule=db.get(TaxRule,int(d["tax_rule_id"])) if d.get("tax_rule_id") else None
    if d.get("tax_rule_id") and (not tax_rule or not tax_rule.active): raise ValueError("Choose an active tax rule.")
    tax=Decimal(str(tax_rule.rate)) if tax_rule else Decimal("0")
    p=Plan(product_id=product_id,name=str(d.get("name","")).strip(),price=money(d.get("price")),billing_frequency=freq,tax_rate=tax,tax_rule_id=tax_rule.id if tax_rule else None,min_quantity=qty,available_from=start,available_until=end,auto_close=bool_value(d.get("auto_close"),"Auto-close"),allow_early_close=bool_value(d.get("allow_early_close"),"Early close",True))
    if not p.name: raise ValueError("Plan name is required.")
    db=get_db(); db.add(p); db.commit(); return jsonify(id=p.id,message="Plan created."),201


@app.get("/api/taxes")
@roles("admin", "staff")
def taxes():
    return jsonify([{"id":t.id,"name":t.name,"rate":float(t.rate)} for t in get_db().scalars(select(TaxRule).where(TaxRule.active.is_(True))).all()])


@app.post("/api/taxes")
@roles("admin")
def tax_create():
    d=body(); rate=decimal_value(d.get("rate",0),"Tax rate")
    if rate<0 or rate>100: raise ValueError("Tax rate must be between 0 and 100%.")
    name=str(d.get("name","")).strip()
    if not name: raise ValueError("Tax rule name is required.")
    t=TaxRule(name=name,rate=rate); get_db().add(t); get_db().commit(); return jsonify(id=t.id),201


@app.get("/api/discounts")
@roles("admin", "staff")
def discounts():
    return jsonify([{"id":d.id,"code":d.code,"name":d.name,"kind":d.kind,"value":float(d.value),"minimum_amount":float(d.minimum_amount),"minimum_quantity":d.minimum_quantity,"starts_on":iso(d.starts_on),"ends_on":iso(d.ends_on),"usage_limit":d.usage_limit,"used_count":d.used_count,"product_id":d.product_id,"active":d.active} for d in get_db().scalars(select(Discount).order_by(Discount.id.desc())).all()])


@app.post("/api/discounts")
@roles("admin")
def discount_create():
    d=body(); kind=d.get("kind"); val=money(d.get("value"))
    if kind not in {"fixed","percent"}: raise ValueError("Discount type must be fixed or percent.")
    if kind=="percent" and val>100: raise ValueError("Percentage discount cannot exceed 100%.")
    starts=parse_date(d.get("starts_on"),"Start date",True); ends=parse_date(d.get("ends_on"),"End date",True)
    if starts and ends and ends<starts: raise ValueError("Discount end date must be after its start date.")
    product_id=int(d["product_id"]) if d.get("product_id") else None
    if product_id and not get_db().get(Product,product_id): return jsonify(error="Product not found."),404
    disc=Discount(code=str(d.get("code","")).strip().upper(),name=str(d.get("name","")).strip(),kind=kind,value=val,minimum_amount=money(d.get("minimum_amount",0)),minimum_quantity=max(1,int(d.get("minimum_quantity",1))),starts_on=starts,ends_on=ends,usage_limit=int(d["usage_limit"]) if d.get("usage_limit") else None,product_id=product_id)
    if not disc.code or not disc.name: raise ValueError("Discount code and name are required.")
    get_db().add(disc); get_db().commit(); return jsonify(id=disc.id),201


@app.get("/api/quote-templates")
@roles("admin", "staff")
def quote_templates():
    db=get_db(); return jsonify([{"id":t.id,"name":t.name,"plan_id":t.plan_id,"plan_name":db.get(Plan,t.plan_id).name,"quantity":t.quantity,"valid_days":t.valid_days} for t in db.scalars(select(QuoteTemplate)).all()])


@app.post("/api/quote-templates")
@roles("admin", "staff")
def quote_template_create():
    d=body(); t=QuoteTemplate(name=str(d.get("name","")).strip(),plan_id=int(d["plan_id"]),quantity=max(1,int(d.get("quantity",1))),valid_days=max(1,min(365,int(d.get("valid_days",14)))),created_by=request.current_user.id)
    plan=get_db().get(Plan,t.plan_id)
    if not plan or not plan.active: return jsonify(error="Choose an active plan."),404
    if t.quantity<plan.min_quantity: raise ValueError(f"This plan requires at least {plan.min_quantity} seats.")
    if not t.name: raise ValueError("Template name is required.")
    get_db().add(t); get_db().commit(); return jsonify(id=t.id),201


@app.get("/api/subscriptions")
@require_login
def subscription_list():
    db=get_db(); query=select(Subscription).order_by(Subscription.created_at.desc())
    if request.current_user.role=="customer": query=query.where(Subscription.customer_id==request.current_user.id)
    status=request.args.get("status")
    if status: query=query.where(Subscription.status==status)
    return jsonify([subscription_json(db,s) for s in db.scalars(query.limit(500)).all()])


@app.post("/api/subscriptions")
@roles("admin", "staff", "customer")
def subscription_create():
    d=body(); user=request.current_user; customer_id=user.id if user.role=="customer" else int(d.get("customer_id",0)); plan=get_db().get(Plan,int(d.get("plan_id",0))); qty=int(d.get("quantity",1))
    customer=get_db().get(User,customer_id)
    if not customer or customer.role!="customer": raise ValueError("Choose a valid customer account.")
    if not plan or not plan.active: raise ValueError("Choose an available plan.")
    if qty<plan.min_quantity or qty>100000: raise ValueError(f"Seat quantity must be between {plan.min_quantity} and 100,000.")
    today=date.today(); start=parse_date(d.get("start_date") or today.isoformat(),"Start date"); expiry=parse_date(d.get("expiry_date"),"Expiry date",True)
    if expiry and expiry<start: raise ValueError("Expiry date cannot be before the start date.")
    if plan.available_from and start<plan.available_from or plan.available_until and start>plan.available_until: raise ValueError("Plan is not available on that start date.")
    variant=get_db().get(Variant,int(d["variant_id"])) if d.get("variant_id") else None
    if variant and variant.product_id!=plan.product_id: raise ValueError("That variant does not belong to the selected plan product.")
    unit=money(Decimal(str(plan.price))+(Decimal(str(variant.additional_price)) if variant else 0)); tax=Decimal(str(plan.tax_rate))
    sub=Subscription(number="SUB-"+secrets.token_hex(4).upper(),customer_id=customer_id,plan_id=plan.id,status="draft",start_date=start,expiry_date=expiry,next_billing_date=start,quantity=qty,unit_price=unit,tax_rate=tax,variant_id=variant.id if variant else None,payment_terms_days=max(0,min(90,int(d.get("payment_terms_days",7)))))
    get_db().add(sub); get_db().commit(); return jsonify(subscription=subscription_json(get_db(),sub)),201


@app.post("/api/subscriptions/from-template/<int:template_id>")
@roles("admin", "staff")
def subscription_from_template(template_id):
    d=body(); template=get_db().get(QuoteTemplate,template_id)
    if not template: return jsonify(error="Quotation template not found."),404
    plan=get_db().get(Plan,template.plan_id)
    if not plan or not plan.active: return jsonify(error="Template plan is unavailable."),404
    if template.quantity<plan.min_quantity: return jsonify(error="Template quantity is below the plan minimum."),409
    customer=get_db().get(User,int(d.get("customer_id",0)))
    if not customer or customer.role!="customer": raise ValueError("Choose a customer.")
    today=date.today(); sub=Subscription(number="SUB-"+secrets.token_hex(4).upper(),customer_id=customer.id,plan_id=plan.id,status="quotation",start_date=parse_date(d.get("start_date") or today.isoformat(),"Start date"),quote_valid_until=today+timedelta(days=template.valid_days),next_billing_date=today,quantity=template.quantity,unit_price=plan.price,tax_rate=plan.tax_rate,payment_terms_days=int(d.get("payment_terms_days",7)))
    get_db().add(sub); get_db().commit(); return jsonify(subscription=subscription_json(get_db(),sub),valid_until=iso(sub.expiry_date)),201


@app.put("/api/subscriptions/<int:sid>/status")
@roles("admin", "staff")
def subscription_status(sid):
    sub=get_db().get(Subscription,sid); d=body(); target=d.get("status")
    if not sub: return jsonify(error="Subscription not found."),404
    transitions={"draft":{"quotation"},"quotation":{"confirmed","draft"},"confirmed":{"active","quotation"}}
    if target not in transitions.get(sub.status,set()): return jsonify(error=f"Cannot move a {sub.status} subscription to {target}."),409
    if target=="confirmed" and sub.quote_valid_until and sub.quote_valid_until<date.today(): return jsonify(error="This quotation has expired. Create a fresh quotation."),409
    if target=="active": sub.next_billing_date=max(sub.start_date,date.today())
    sub.status=target; get_db().commit(); return jsonify(subscription=subscription_json(get_db(),sub))


@app.post("/api/subscriptions/<int:sid>/pause")
@require_login
def subscription_pause(sid):
    sub=get_db().get(Subscription,sid)
    if not sub: return jsonify(error="Subscription not found."),404
    if not can_manage_subscription(request.current_user,sub): return jsonify(error="You do not have permission to manage this subscription."),403
    if sub.status!="active": return jsonify(error="Only an active subscription can be paused."),409
    sub.status="paused"; sub.paused_at=date.today(); get_db().commit(); return jsonify(subscription=subscription_json(get_db(),sub))


@app.post("/api/subscriptions/<int:sid>/resume")
@require_login
def subscription_resume(sid):
    sub=get_db().get(Subscription,sid)
    if not sub: return jsonify(error="Subscription not found."),404
    if not can_manage_subscription(request.current_user,sub): return jsonify(error="You do not have permission to manage this subscription."),403
    if sub.status!="paused": return jsonify(error="Only a paused subscription can be resumed."),409
    if sub.paused_at and sub.next_billing_date:
        pause_days=max(0,(date.today()-sub.paused_at).days)
        sub.next_billing_date+=timedelta(days=pause_days)
    sub.paused_at=None; sub.status="active"; get_db().commit(); return jsonify(subscription=subscription_json(get_db(),sub))


@app.post("/api/subscriptions/<int:sid>/close")
@require_login
def subscription_close(sid):
    sub=get_db().get(Subscription,sid)
    if not sub: return jsonify(error="Subscription not found."),404
    if not can_manage_subscription(request.current_user,sub): return jsonify(error="You do not have permission to manage this subscription."),403
    plan=get_db().get(Plan,sub.plan_id)
    if sub.status not in {"active","paused"} or not plan.allow_early_close: return jsonify(error="This subscription cannot be closed early."),409
    sub.status="closed"; sub.closed_at=date.today(); sub.paused_at=None; get_db().commit(); return jsonify(subscription=subscription_json(get_db(),sub))


@app.post("/api/subscriptions/<int:sid>/renew")
@require_login
def subscription_renew(sid):
    old=get_db().get(Subscription,sid)
    if not old: return jsonify(error="Subscription not found."),404
    if not can_manage_subscription(request.current_user,old): return jsonify(error="You do not have permission to manage this subscription."),403
    if old.status!="closed": return jsonify(error="Only a closed subscription can be renewed."),409
    plan=get_db().get(Plan,old.plan_id)
    if not plan or not plan.active: return jsonify(error="This plan is no longer available for renewal."),409
    today=date.today(); new=Subscription(number="SUB-"+secrets.token_hex(4).upper(),customer_id=old.customer_id,plan_id=old.plan_id,status="draft",start_date=today,expiry_date=None,next_billing_date=today,quantity=old.quantity,unit_price=old.unit_price,tax_rate=old.tax_rate,variant_id=old.variant_id,payment_terms_days=old.payment_terms_days)
    get_db().add(new); get_db().commit(); return jsonify(subscription=subscription_json(get_db(),new)),201


@app.post("/api/subscriptions/auto-close")
@roles("admin", "staff")
def auto_close():
    db=get_db(); rows=db.scalars(select(Subscription).join(Plan).where(Subscription.status=="active",Subscription.expiry_date.is_not(None),Subscription.expiry_date<=date.today(),Plan.auto_close.is_(True))).all()
    for sub in rows: sub.status="closed"; sub.closed_at=date.today()
    db.commit(); return jsonify(closed=len(rows))


@app.get("/api/invoices")
@require_login
def invoice_list():
    db=get_db(); q=select(Invoice).order_by(Invoice.invoice_date.desc(),Invoice.id.desc())
    if request.current_user.role=="customer": q=q.where(Invoice.customer_id==request.current_user.id)
    rows=db.scalars(q.limit(1000)).all()
    paid_rows=db.execute(select(Payment.invoice_id,func.sum(Payment.amount)).where(Payment.invoice_id.in_([i.id for i in rows])).group_by(Payment.invoice_id)).all() if rows else []
    paid_by_id={row[0]:row[1] for row in paid_rows}
    return jsonify([invoice_json(db,i,paid_by_id.get(i.id,0)) for i in rows])


@app.post("/api/subscriptions/<int:sid>/invoice")
@roles("admin", "staff")
def invoice_create(sid):
    db=get_db(); sub=db.get(Subscription,sid)
    if not sub: return jsonify(error="Subscription not found."),404
    bill_date=parse_date(body().get("invoice_date") or iso(sub.next_billing_date or date.today()),"Invoice date")
    if bill_date>date.today(): return jsonify(error=f"This subscription is not due until {bill_date.isoformat()}."),409
    try:
        invoice=create_invoice_record(db,sub,bill_date)
        db.commit()
    except ValueError as error:
        db.rollback(); return jsonify(error=str(error)),409
    return jsonify(invoice=invoice_json(db,invoice)),201


def create_invoice_record(db, sub, bill_date):
    if sub.status!="active": raise ValueError("Only active subscriptions can be billed.")
    if sub.next_billing_date and bill_date<sub.next_billing_date: raise ValueError(f"Next invoice is due on {sub.next_billing_date.isoformat()}.")
    period=f"{bill_date.year:04d}-{bill_date.month:02d}-{bill_date.day:02d}"
    if db.scalar(select(Invoice).where(Invoice.subscription_id==sub.id,Invoice.billing_period==period)): raise ValueError("This billing period already has an invoice.")
    plan=db.get(Plan,sub.plan_id); product=db.get(Product,plan.product_id)
    subtotal=money(sub.unit_price*sub.quantity)
    discount=None; discount_amount=Decimal("0.00")
    candidate=db.scalars(select(Discount).where(Discount.active.is_(True)).order_by(Discount.id)).all()
    for d in candidate:
        if d.starts_on and d.starts_on>bill_date or d.ends_on and d.ends_on<bill_date or d.usage_limit is not None and d.used_count>=d.usage_limit or d.product_id and d.product_id!=product.id or sub.quantity<d.minimum_quantity or subtotal<d.minimum_amount: continue
        discount=d
        discount_amount=min(subtotal, money(subtotal*d.value/100) if d.kind=="percent" else money(d.value))
        break
    taxable=max(Decimal("0"),subtotal-discount_amount); tax=money(taxable*sub.tax_rate/100); total=money(taxable+tax)
    invoice=Invoice(number="INV-"+secrets.token_hex(4).upper(),subscription_id=sub.id,customer_id=sub.customer_id,billing_period=period,invoice_date=bill_date,due_date=bill_date+timedelta(days=sub.payment_terms_days),subtotal=subtotal,discount_amount=discount_amount,tax_amount=tax,total_amount=total,status="draft",discount_id=discount.id if discount else None)
    db.add(invoice); db.flush(); variant=db.get(Variant,sub.variant_id) if sub.variant_id else None; desc=product.name+(f" · {variant.name}" if variant else "")+(f" x {sub.quantity}" if sub.quantity>1 else "")
    db.add(InvoiceLine(invoice_id=invoice.id,description=desc,quantity=sub.quantity,unit_price=sub.unit_price,tax_rate=sub.tax_rate,line_total=total))
    if discount: discount.used_count+=1
    sub.next_billing_date=next_date(bill_date,plan.billing_frequency)
    return invoice


@app.post("/api/billing/run")
@roles("admin", "staff")
def billing_run():
    result=process_due_billing(get_db(),date.today())
    return jsonify(result)


def process_due_billing(db, today):
    expired=db.scalars(select(Subscription).join(Plan).where(Subscription.status=="active",Subscription.expiry_date.is_not(None),Subscription.expiry_date<=today,Plan.auto_close.is_(True))).all()
    for sub in expired: sub.status="closed"; sub.closed_at=today
    if expired: db.commit()
    due=db.scalars(select(Subscription).where(Subscription.status=="active",Subscription.next_billing_date.is_not(None),Subscription.next_billing_date<=today).order_by(Subscription.next_billing_date).limit(500)).all()
    created=0; skipped=0; still_due=0
    for sub in due:
        cycles=0
        while sub.status=="active" and sub.next_billing_date and sub.next_billing_date<=today and cycles<24:
            try:
                create_invoice_record(db,sub,sub.next_billing_date); db.commit(); created+=1; cycles+=1
            except ValueError:
                db.rollback(); skipped+=1; break
        if sub.next_billing_date and sub.next_billing_date<=today: still_due+=1
    return {"created":created,"skipped":skipped,"still_due":still_due,"checked":len(due)}


@app.post("/api/invoices/<int:iid>/confirm")
@roles("admin", "staff")
def invoice_confirm(iid):
    i=get_db().get(Invoice,iid)
    if not i: return jsonify(error="Invoice not found."),404
    if i.status!="draft": return jsonify(error="Only draft invoices can be confirmed."),409
    i.status="confirmed"; get_db().commit(); return jsonify(invoice=invoice_json(get_db(),i))


@app.post("/api/invoices/<int:iid>/cancel")
@roles("admin", "staff")
def invoice_cancel(iid):
    db=get_db(); invoice=db.get(Invoice,iid)
    if not invoice: return jsonify(error="Invoice not found."),404
    if invoice.status not in {"draft","confirmed"}: return jsonify(error="Only an unpaid invoice can be cancelled."),409
    paid=db.scalar(select(func.coalesce(func.sum(Payment.amount),0)).where(Payment.invoice_id==iid)) or 0
    if Decimal(str(paid))>0: return jsonify(error="An invoice with a recorded payment cannot be cancelled."),409
    invoice.status="cancelled"; db.commit(); return jsonify(message="Invoice cancelled.")


@app.post("/api/payments")
@roles("admin", "staff")
def payment_create():
    d=body(); db=get_db(); invoice=db.get(Invoice,int(d.get("invoice_id",0)))
    if not invoice: return jsonify(error="Invoice not found."),404
    amount=money(d.get("amount"))
    paid=Decimal(str(db.scalar(select(func.coalesce(func.sum(Payment.amount),0)).where(Payment.invoice_id==invoice.id))))
    if invoice.status=="draft": return jsonify(error="Confirm the invoice before recording payment."),409
    if amount<=0 or amount>invoice.total_amount-paid: raise ValueError("Payment must be positive and cannot exceed the remaining balance.")
    payment=Payment(invoice_id=invoice.id,method=str(d.get("method","Other"))[:40],amount=amount,paid_on=parse_date(d.get("paid_on") or date.today().isoformat(),"Payment date"),note=str(d.get("note", ""))[:1000]); db.add(payment)
    if paid+amount>=invoice.total_amount: invoice.status="paid"
    db.commit(); return jsonify(id=payment.id,remaining=float(money(invoice.total_amount-paid-amount)),invoice_status=invoice.status),201


@app.get("/api/payments")
@roles("admin", "staff")
def payment_list():
    db=get_db(); rows=db.scalars(select(Payment).order_by(Payment.paid_on.desc(),Payment.id.desc()).limit(1000)).all()
    return jsonify([{"id":p.id,"invoice_id":p.invoice_id,"invoice_number":db.get(Invoice,p.invoice_id).number,"method":p.method,"amount":float(p.amount),"paid_on":iso(p.paid_on),"note":p.note} for p in rows])


@app.get("/api/dashboard")
@roles("admin", "staff")
def dashboard():
    db=get_db(); today=date.today(); month_start=today.replace(day=1)
    active=db.scalar(select(func.count()).select_from(Subscription).where(Subscription.status=="active")) or 0
    revenue=db.scalar(select(func.coalesce(func.sum(Payment.amount),0)).where(Payment.paid_on>=month_start,Payment.paid_on<=today)) or 0
    paid_by_invoice=select(Payment.invoice_id.label("invoice_id"),func.sum(Payment.amount).label("paid")).group_by(Payment.invoice_id).subquery()
    outstanding=db.scalar(select(func.coalesce(func.sum(Invoice.total_amount-func.coalesce(paid_by_invoice.c.paid,0)),0)).outerjoin(paid_by_invoice,Invoice.id==paid_by_invoice.c.invoice_id).where(Invoice.status.not_in(["paid","cancelled"]))) or 0
    overdue=db.scalar(select(func.count()).select_from(Invoice).where(Invoice.status.not_in(["paid","cancelled"]),Invoice.due_date<today)) or 0
    return jsonify(active_subscriptions=active,monthly_revenue=float(revenue),outstanding=float(money(outstanding)),overdue_invoices=overdue,total_subscriptions=db.scalar(select(func.count()).select_from(Subscription)) or 0,customers=db.scalar(select(func.count()).select_from(User).where(User.role=="customer")) or 0)


@app.get("/api/reports")
@roles("admin", "staff")
def report():
    db=get_db(); start=parse_date(request.args.get("from") or date.today().replace(day=1).isoformat(),"From date"); end=parse_date(request.args.get("to") or date.today().isoformat(),"To date")
    if end<start: raise ValueError("End date must be on or after start date.")
    cash_received=db.scalar(select(func.coalesce(func.sum(Payment.amount),0)).where(Payment.paid_on>=start,Payment.paid_on<=end)) or 0
    invoiced=db.scalar(select(func.coalesce(func.sum(Invoice.total_amount),0)).where(Invoice.invoice_date>=start,Invoice.invoice_date<=end)) or 0
    overdue_rows=db.scalars(select(Invoice).where(Invoice.status.not_in(["paid","cancelled"]),Invoice.due_date<date.today()).order_by(Invoice.due_date).limit(500)).all()
    paid_rows=db.execute(select(Payment.invoice_id,func.sum(Payment.amount)).where(Payment.invoice_id.in_([i.id for i in overdue_rows])).group_by(Payment.invoice_id)).all() if overdue_rows else []
    paid_by_id={row[0]:row[1] for row in paid_rows}
    return jsonify(period={"from":iso(start),"to":iso(end)},cash_received=float(cash_received),invoiced=float(invoiced),active_subscriptions=db.scalar(select(func.count()).select_from(Subscription).where(Subscription.status=="active")) or 0,overdue=[invoice_json(db,i,paid_by_id.get(i.id,0)) for i in overdue_rows])


@app.cli.command("create-admin")
def create_admin():
    """Create the first admin account using hidden password input."""
    import getpass
    name=input("Admin name: ").strip(); email=input("Admin email: ").strip().lower(); password=getpass.getpass("Password (9+ chars, mixed case and special character): "); validate_password(password)
    db=get_db()
    if db.scalar(select(User).where(User.role=="admin")): raise SystemExit("An admin account already exists.")
    user=User(name=name,email=email,password_hash=generate_password_hash(password),role="admin"); db.add(user); db.commit(); print(f"Admin account created for {user.email}.")


@app.cli.command("seed-demo")
def seed_demo():
    """Add clearly labelled fictional records for a presentation demo."""
    db=get_db()
    if db.scalar(select(Product)): print("Demo data already exists."); return
    admin=db.scalar(select(User).where(User.role=="admin"))
    if not admin: raise SystemExit("Create an admin first with: flask --app backend.app create-admin")
    p=Product(name="LoopDesk",product_type="business software",sales_price=1499,cost_price=350,notes="Team workspace for customer operations."); db.add(p); db.flush()
    db.add_all([Variant(product_id=p.id,name="Standard",additional_price=0),Variant(product_id=p.id,name="Odoo edition",additional_price=560)])
    plan=Plan(product_id=p.id,name="Growth monthly",price=1499,billing_frequency="monthly",min_quantity=1,auto_close=False,allow_early_close=True); db.add(plan)
    customer=User(name="Aarav Mehta",email="aarav.demo@example.test",password_hash=generate_password_hash("DemoCustomer2026!"),role="customer"); db.add(customer); db.flush()
    db.add(Subscription(number="SUB-DEMO001",customer_id=customer.id,plan_id=plan.id,status="active",start_date=date.today()-timedelta(days=5),next_billing_date=date.today(),quantity=4,unit_price=Decimal("1499"),tax_rate=Decimal("18"),payment_terms_days=7))
    db.add(TaxRule(name="GST",rate=18)); db.commit(); print("Demo records added. Customer portal: aarav.demo@example.test / DemoCustomer2026!")


@app.cli.command("run-billing")
def run_billing_cli():
    """Generate invoices for due subscriptions; schedule this daily."""
    with app.app_context():
        result=process_due_billing(get_db(),date.today())
        print(f"Billing run complete: {result['created']} created, {result['skipped']} skipped, {result['still_due']} still due.")


@app.cli.command("close-expired")
def close_expired_cli():
    """Close active subscriptions whose plan enables automatic closure."""
    with app.app_context():
        db=get_db(); today=date.today()
        rows=db.scalars(select(Subscription).join(Plan).where(Subscription.status=="active",Subscription.expiry_date.is_not(None),Subscription.expiry_date<=today,Plan.auto_close.is_(True))).all()
        for sub in rows: sub.status="closed"; sub.closed_at=today
        db.commit(); print(f"Expiry check complete: {len(rows)} subscriptions closed.")


if __name__ == "__main__":
    app.run(debug=os.getenv("FLASK_DEBUG", "false").lower() == "true")

