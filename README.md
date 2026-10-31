# Brightloop

Brightloop is a Flask subscription operations app for a small subscription business. It brings customer accounts, products, plans, lifecycle tracking, recurring invoices, payment records and finance summaries into one browser workspace.

## Start it on Windows

The quickest demo uses SQLite. It does not need a separate database server.

1. Install Python 3.10 or newer.
2. Open PowerShell in this `Brightloop` folder and run:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
py -m pip install -r requirements.txt
Copy-Item .env.example .env
```

3. Open `.env` and replace `SECRET_KEY` with a long random value. The example database is a local SQLite file created automatically in `instance`.
4. Create your administrator account:

```powershell
flask --app backend.app create-admin
```

The command asks for a name, email and password. Passwords need at least nine characters, an uppercase letter, a lowercase letter and a special character.

5. (Optional) Add fictional demo records. The command prints the demo customer's sign-in details:

```powershell
flask --app backend.app seed-demo
```

6. Start Brightloop:

```powershell
flask --app backend.app run
```

Open <http://127.0.0.1:5000>. Sign in with the administrator details from step 4. Do not use Flask's development server as a public production server.

Run the workflow checks from the project folder after installing dependencies:

```powershell
py -m unittest backend.test_workflows
```

## Use MySQL instead

SQLite is the easiest route for judging and teammate onboarding. For MySQL, install and start MySQL Server, create the `brightloop_db` database with `schema.sql` (or create the database manually and let the app create its tables), and set `DATABASE_URL` in `.env`, for example:

```text
DATABASE_URL=mysql+pymysql://brightloop_user:YOUR_PASSWORD@localhost:3306/brightloop_db?charset=utf8mb4
```

Use a dedicated MySQL account rather than `root`. URL encode special characters in the password. Never commit `.env` or database credentials. The included schema is for MySQL; SQLAlchemy creates the same tables automatically when Brightloop starts.

## Daily billing and expiry checks

Brightloop does not keep a background process running. Schedule these commands once per day with Windows Task Scheduler (or your server scheduler):

```powershell
.\.venv\Scripts\flask.exe --app backend.app run-billing
.\.venv\Scripts\flask.exe --app backend.app close-expired
```

Set the task's working directory to this `Brightloop` folder. The billing command creates invoices for every due period (up to 24 catch-up periods per subscription per run), prevents duplicate periods in the database, and leaves each invoice in Draft for review before confirmation. The application also has a **Run due billing** button for the demo. Run expiry checks after billing if that order fits your policy.

## What the application does

- **Accounts and permissions:** customer self-registration, hashed passwords, signed-in sessions, admin/staff/customer roles, and administrator-only staff creation. Customers can see only their own subscriptions and invoices.
- **Password recovery:** one-time, expiring reset tokens. In demo mode the reset URL is shown in the browser because no email provider is configured. This is not email delivery; connect a mail service and switch off `RESET_LINK_MODE=demo` before public use.
- **Catalog:** products, optional variants, plans, daily/weekly/monthly/yearly cycles, minimum seats, availability dates, tax rules and close-on-expiry/early-close settings.
- **Subscription lifecycle:** Draft → Quotation → Confirmed → Active → Paused/Resumed → Closed, with renewal creating a fresh Draft. Resuming shifts the next billing date by the pause duration. Quote templates apply their validity period. Invoices can only be generated for active subscriptions that are due.
- **Billing and cash:** invoices use the subscription's saved price and tax rate, apply an eligible discount, calculate a due date, prevent duplicate subscription-period invoices and keep a payment ledger. Partial payments are supported; the invoice becomes Paid when its balance reaches zero. Unpaid invoices can be cancelled.
- **Finance:** dashboard totals, date-filtered invoice/payment totals, overdue invoice list, customer and operational tables, and printable invoice summaries.

## Architecture, in plain language

```text
Browser (HTML, CSS, JavaScript)
          │ same-origin JSON requests and secure session cookie
          ▼
Flask routes (backend/app.py)
          │ input checks, role checks and subscription rules
          ▼
SQLAlchemy models (also in backend/app.py)
          │
          ├── SQLite file for the quick start
          └── MySQL when DATABASE_URL is configured
```

- `templates/index.html` gives Flask the page to serve.
- `static/app.js` draws each workspace screen and calls the Flask API. Business records are no longer kept in browser local storage.
- `backend/app.py` validates requests, checks permissions, applies lifecycle rules and calculates billing totals.
- `backend/db.py` chooses the database connection. The same models work with SQLite or MySQL.
- `schema.sql` is the MySQL schema. The ORM creates tables for a new SQLite or MySQL database on first start.
- `.env` holds each teammate's local database URL and secret key. It is ignored by Git; `.env.example` contains safe placeholders.

## A beginner-friendly way for the four of you to learn it

1. **Frontend teammate:** trace a button in `static/app.js`, find the `data-action` handler, then follow the `api()` call. The browser sends JSON to a route; it does not decide whether a payment or status change is valid.
2. **Flask/API teammate:** find that URL in `backend/app.py`. The decorator checks who is signed in and whether their role is allowed. The route checks input, changes database records and returns JSON.
3. **Database teammate:** inspect the model classes at the top of `backend/app.py`. A foreign key connects a subscription to its customer and plan; an invoice points back to its subscription. `schema.sql` is the readable MySQL version of that structure.
4. **Product/demo teammate:** walk through a plan, quote, activation, billing, payment and report. Explain the rules the system enforces and where the dashboard numbers come from.

When debugging, follow the same path in reverse: browser screen → API request → route and role check → database row → JSON response → refreshed screen.

## Git hygiene

Commit the source, `schema.sql`, `requirements.txt`, `.env.example` and this README. Do not commit `.env`, the SQLite database, virtual environment, Python cache, logs or real customer data. The earlier hard-coded MySQL password has been removed from the delivered project; rotate it if it was real or reused anywhere.

## Known boundaries to explain honestly

- Email transport is not wired up. Password-reset links are shown locally in demo mode; invoices are printable but are not emailed.
- This is a hackathon-ready local app, not a security-audited production billing service. Use HTTPS, a production WSGI server, a properly protected secret, database backups, monitoring and an email provider before putting real customer data online.
- Payment records are manual bookkeeping entries. No bank, card processor, tax authority or payment gateway is connected.
- The overview chart is a visual summary placeholder; the date-filtered report totals and overdue list are the data-backed finance view.

## Demo and recording checklist

1. Sign in as admin; point out the clear dashboard and customer/staff roles.
2. Add a product with a variant and price adjustment; create a taxed monthly plan with minimum quantity and lifecycle rules.
3. Add a quote template and create a quotation for a customer. Show Draft → Quotation → Confirmed → Active.
4. Pause and resume a subscription; show an early close and create a renewal draft.
5. Run due billing. Open the new Draft invoice, confirm it, record a partial payment, then record the remaining amount and show it marked Paid.
6. Add a discount with a usage limit; create another eligible invoice and show the discount/tax calculation.
7. Sign out and register/sign in as a customer. Show only that customer's subscriptions and invoices.
8. Show the date-filtered report and overdue list. Mention the scheduler commands and the email/payment gateway integrations that are not connected.
9. End on the repository README and explain the one-command install flow. Avoid showing `.env` or real passwords in the video.
