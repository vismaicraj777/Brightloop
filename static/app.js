const $ = (q, root = document) => root.querySelector(q);
const $$ = (q, root = document) => [...root.querySelectorAll(q)];
const state = { user: null, csrf: "", page: "dashboard", cache: {} };
const nav = [
  ["dashboard", "Overview", "◫", ["admin", "staff"]], ["customers", "Customers", "♙", ["admin", "staff"]],
  ["catalog", "Products & plans", "▣", ["admin", "staff"]], ["subscriptions", "Subscriptions", "↻", ["admin", "staff", "customer"]],
  ["invoices", "Invoices", "▤", ["admin", "staff", "customer"]], ["payments", "Payments", "◈", ["admin", "staff"]],
  ["discounts", "Discounts", "％", ["admin", "staff"]], ["reports", "Reports", "▥", ["admin", "staff"]],
  ["settings", "Settings", "⚙", ["admin"]]
];
const money = value => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value || 0));
const dateLabel = value => value ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`)) : "—";
const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function toast(message, isError = false) {
  const el = $("#toast"); el.textContent = message; el.className = `toast show${isError ? " error" : ""}`;
  clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove("show"), 3200);
}

async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (state.csrf && !["GET", "HEAD"].includes((options.method || "GET").toUpperCase())) headers["X-CSRF-Token"] = state.csrf;
  let response;
  try { response = await fetch(path, { credentials: "same-origin", ...options, headers }); }
  catch { throw new Error("Brightloop could not reach its server. Check that the app is running."); }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status}).`);
  return payload;
}

function showAuth(panel = "signInPanel") {
  $("#authView").hidden = false; $("#appView").hidden = true;
  for (const id of ["signInPanel", "registerPanel", "resetPanel"]) $("#" + id).hidden = id !== panel;
}

function showApp() {
  $("#authView").hidden = true; $("#appView").hidden = false;
  const u = state.user; const role = u.role;
  if (!nav.some(item => item[0] === state.page && item[3].includes(role))) state.page = role === "customer" ? "subscriptions" : "dashboard";
  $("#profileName").textContent = u.name; $("#profileRole").textContent = role; $("#profileAvatar").textContent = u.name.slice(0, 1).toUpperCase(); $("#topAvatar").textContent = u.name.slice(0, 1).toUpperCase();
  $("#todayLabel").textContent = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" }).format(new Date());
  $("#navigation").innerHTML = nav.filter(item => item[3].includes(role)).map(([id, label, icon]) => `<button class="nav-item ${state.page === id ? "active" : ""}" data-page="${id}"><span class="nav-symbol">${icon}</span>${label}</button>`).join("");
  renderPage(state.page);
}

function heading(eyebrow, title, description, actions = "") {
  return `<div class="page-heading"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${description}</p></div><div class="heading-actions">${actions}</div></div>`;
}
function metric(label, value, caption, symbol) {
  return `<div class="metric-card"><div class="metric-top"><span class="metric-label">${label}</span><span class="metric-icon">${symbol}</span></div><div class="metric-value">${value}</div><div class="metric-caption">${caption}</div><div class="metric-bar"></div></div>`;
}
function badge(value) { return `<span class="badge ${esc(value).toLowerCase()}">${esc(value)}</span>`; }
function empty(title, text) { return `<div class="empty-state"><strong>${title}</strong><span>${text}</span></div>`; }
function table(headers, rows, blankTitle = "Nothing here yet", blankText = "New records will appear here.") {
  return `<div class="table-panel"><div class="table-wrap"><table><thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows || `<tr><td colspan="${headers.length}">${empty(blankTitle, blankText)}</td></tr>`}</tbody></table></div></div>`;
}
function action(label, actionName, id, kind = "") { return `<button class="button small ${kind}" data-action="${actionName}" data-id="${id}">${label}</button>`; }
function setPage(id) { state.page = id; showApp(); }

async function renderPage(page) {
  state.page = page; $("#currentSection").textContent = nav.find(n => n[0] === page)?.[1] || "Overview";
  $$(".nav-item").forEach(x => x.classList.toggle("active", x.dataset.page === page));
  const root = $("#pageContent"); root.innerHTML = `<div class="loading-surface">Loading your workspace…</div>`;
  try {
    if (page === "dashboard") await renderDashboard(root);
    else if (page === "customers") await renderCustomers(root);
    else if (page === "catalog") await renderCatalog(root);
    else if (page === "subscriptions") await renderSubscriptions(root);
    else if (page === "invoices") await renderInvoices(root);
    else if (page === "payments") await renderPayments(root);
    else if (page === "discounts") await renderDiscounts(root);
    else if (page === "reports") await renderReports(root);
    else await renderSettings(root);
  } catch (error) { root.innerHTML = `<div class="notice warning">${esc(error.message)}</div>`; }
}

async function renderDashboard(root) {
  const d = await api("/api/dashboard"); const subs = await api("/api/subscriptions"); const inv = await api("/api/invoices");
  const months = [];
  for (let i = 5; i >= 0; i--) { const dt = new Date(); dt.setDate(1); dt.setMonth(dt.getMonth() - i); months.push({ date: dt, label: dt.toLocaleString("en", { month: "short" }) }); }
  const max = Math.max(1, Number(d.monthly_revenue));
  const latest = subs.slice(0, 5).map(s => `<tr><td><div class="cell-main">${esc(s.customer_name)}</div><div class="cell-sub">${esc(s.number)}</div></td><td>${esc(s.plan_name)}</td><td>${money(s.total)}</td><td>${dateLabel(s.next_billing_date)}</td><td>${badge(s.status)}</td></tr>`).join("");
  const recentInvoices = inv.slice(0, 4).map(i => `<div class="activity-row"><span class="activity-dot"></span><div class="activity-copy"><b>${esc(i.number)} · ${money(i.total_amount)}</b><small>${esc(i.customer_name)} · ${dateLabel(i.invoice_date)} · ${esc(i.status)}</small></div></div>`).join("");
  root.innerHTML = `${heading("YOUR BUSINESS AT A GLANCE", `Welcome back, ${esc(state.user.name.split(" ")[0])}`, "The numbers that matter, in one clear view.", `<button class="button primary" data-action="new-subscription">＋ New subscription</button>`)}
    <section class="cards">${metric("Cash received this month",money(d.monthly_revenue),"Recorded payments","↗")}${metric("Active subscriptions",d.active_subscriptions,"Currently delivering service","↻")}${metric("Outstanding balance",money(d.outstanding),"Across unpaid invoices","◉")}${metric("Overdue invoices",d.overdue_invoices,"Need a follow-up","⌁")}</section>
    <section class="dashboard-grid"><div class="panel"><div class="panel-heading"><div><h3>Revenue pulse</h3><p>Payments collected this month</p></div><span class="badge active">Live</span></div><div class="trend-list">${months.map(m=>`<div class="trend-month"><div class="trend-track"><div class="trend-fill" style="height:${Math.max(4,Math.min(100,Number(d.monthly_revenue)/max*100))}%"></div></div><small>${m.label}</small></div>`).join("")}</div><p class="subtle-copy">Use Reports for accurate date-range totals. Historical chart points will fill as payments are recorded.</p></div>
    <div class="panel"><div class="panel-heading"><div><h3>Latest invoices</h3><p>Billing activity from your workspace</p></div><button class="link-button" data-page="invoices">View invoices →</button></div><div class="activity-list">${recentInvoices || empty("No invoices yet","Generate an invoice when a subscription is due.")}</div></div></section>
    <div class="panel-heading"><div><h3>Recent subscriptions</h3><p>Latest customer plans and their current status</p></div><button class="link-button" data-page="subscriptions">View all →</button></div>${table(["Customer","Plan","Recurring value","Next billing","Status"],latest,"No subscriptions yet","Create the first one to start tracking recurring revenue.")}`;
}

async function renderCustomers(root) {
  const rows = await api("/api/customers");
  root.innerHTML = `${heading("CUSTOMER RELATIONSHIPS","Customers","A single, current record for every customer.")}${metric("Customer accounts",rows.length,"Registered customer portal accounts","♙")}<div style="height:14px"></div>${table(["Customer","Email","Account","Actions"],rows.map(u=>`<tr><td><div class="cell-main">${esc(u.name)}</div></td><td>${esc(u.email)}</td><td>${badge("active")}</td><td>${action("View subscriptions","customer-subs",u.id,"subtle")}</td></tr>`).join(""),"No customer accounts","Customers appear here after registration.")}`;
}

async function renderCatalog(root) {
  const [products, plans] = await Promise.all([api("/api/products"),api("/api/plans")]); state.cache.products=products; state.cache.plans=plans;
  if (state.user.role === "customer") { root.innerHTML = `${heading("THE BRIGHTLOOP CATALOG","Plans for your next chapter","Browse available subscription plans.")}${catalogPlans(plans)}`; return; }
  const productRows=products.map(p=>`<tr><td><div class="cell-main">${esc(p.name)}</div><div class="cell-sub">${esc(p.product_type)}</div></td><td>${money(p.sales_price)}</td><td>${p.variants.map(v=>`${esc(v.name)} +${money(v.additional_price)}`).join(" · ")||"—"}</td><td>${esc(p.notes||"—")}</td></tr>`).join("");
  const planRows=plans.map(p=>`<tr><td><div class="cell-main">${esc(p.name)}</div><div class="cell-sub">${esc(p.product_name)}</div></td><td>${money(p.price)}</td><td>${esc(p.billing_frequency)}</td><td>${p.min_quantity}</td><td>${p.auto_close?"Automatic":"Manual"}</td><td>${p.allow_early_close?"Allowed":"Not allowed"}</td></tr>`).join("");
  root.innerHTML=`${heading("CATALOG MANAGEMENT","Products & plans","Build the offers your customers can subscribe to.",`<button class="button subtle" data-action="new-plan">＋ Add plan</button><button class="button primary" data-action="new-product">＋ Add product</button>`)}<div class="section-tabs"><button class="active" data-action="catalog-tab" data-tab="products">Products (${products.length})</button><button data-action="catalog-tab" data-tab="plans">Plans (${plans.length})</button></div><div id="catalogContent">${catalogProductsTable(productRows)}</div>`;
}
function catalogProductsTable(rows) { return table(["Product","Base price","Variants","Notes"],rows,"No products yet","Add a product to start building your catalog."); }
function catalogPlans(plans) { return table(["Plan","Price","Billing","Min seats","Availability"],plans.map(p=>`<tr><td><div class="cell-main">${esc(p.name)}</div><div class="cell-sub">${esc(p.product_name)}</div></td><td>${money(p.price)}</td><td>${esc(p.billing_frequency)}</td><td>${p.min_quantity}</td><td>${p.available_from?dateLabel(p.available_from):"Now"}</td></tr>`).join(""),"No plans available","Check back later or contact your Brightloop team."); }

async function renderSubscriptions(root) {
  let [subs,plans]=await Promise.all([api("/api/subscriptions"),api("/api/plans")]); state.cache.plans=plans;
  if(state.customerFilter){subs=subs.filter(s=>s.customer_id===state.customerFilter);state.customerFilter=null;}
 if(state.user.role==="customer") { root.innerHTML=`${heading("YOUR SERVICE","My subscriptions","See what’s active and when your next billing is due.",`<button class="button primary" data-action="new-subscription">＋ Browse plans</button>`)}${table(["Subscription","Plan","Recurring value","Next billing","Status","Manage"],subs.map(s=>`<tr><td><div class="cell-main">${esc(s.number)}</div><div class="cell-sub">Started ${dateLabel(s.start_date)}${s.quote_valid_until?` · Quote valid to ${dateLabel(s.quote_valid_until)}`:""}</div></td><td>${esc(s.plan_name)}</td><td>${money(s.total)}</td><td>${dateLabel(s.next_billing_date)}</td><td>${badge(s.status)}</td><td><div class="actions-inline">${s.status==="active"?`${action("Pause","pause",s.id,"subtle")}${s.allow_early_close?action("End","close",s.id,"danger"):""}`:s.status==="paused"?`${action("Resume","resume",s.id,"subtle")}${s.allow_early_close?action("End","close",s.id,"danger"):""}`:s.status==="closed"?action("Renew","renew",s.id,"subtle"):""}</div></td></tr>`).join(""),"No subscriptions yet","Choose a plan to send a request to the Brightloop team.")}`;return; }
  const [customers,templates]=await Promise.all([api("/api/customers"),api("/api/quote-templates")]); state.cache.customers=customers;
  const rows=subs.map(s=>{let actions=""; if(s.status==="draft")actions=action("Prepare quote","status",s.id,"subtle"); else if(s.status==="quotation")actions=action("Confirm","status-confirm",s.id,"subtle"); else if(s.status==="confirmed")actions=action("Activate","status-activate",s.id,"primary"); else if(s.status==="active")actions=`${action("Invoice","invoice",s.id,"subtle")} ${action("Pause","pause",s.id)} ${action("Close","close",s.id,"danger")}`; else if(s.status==="paused")actions=`${action("Resume","resume",s.id,"subtle")} ${action("Close","close",s.id,"danger")}`; else if(s.status==="closed")actions=action("Renew","renew",s.id,"subtle"); return `<tr><td><div class="cell-main">${esc(s.number)}</div><div class="cell-sub">${dateLabel(s.start_date)}${s.expiry_date?` → ${dateLabel(s.expiry_date)}`:""}</div></td><td><div class="cell-main">${esc(s.customer_name)}</div><div class="cell-sub">${esc(s.customer_email)}</div></td><td>${esc(s.plan_name)}</td><td>${s.quantity}</td><td>${money(s.total)}</td><td>${badge(s.status)}</td><td><div class="actions-inline">${actions}</div></td></tr>`;}).join("");
  root.innerHTML=`${heading("RENEWALS, MADE VISIBLE","Subscriptions","Move each customer from the first quote through renewal.",`<button class="button subtle" data-action="new-template">＋ Quote template</button><button class="button primary" data-action="new-subscription">＋ New subscription</button>`)}<div class="notice" style="margin-bottom:14px">Lifecycle: Draft → Quotation → Confirmed → Active → Paused / Resumed → Closed → Renewed. Invoicing is available only when a subscription is active and billing is due.</div><div class="panel" style="margin-bottom:14px"><div class="panel-heading"><div><h3>Quotation templates</h3><p>Reusable plan and quantity defaults for your sales team.</p></div><button class="button small" data-action="new-template">Add template</button></div>${templates.length?templates.map(t=>`<div class="quote-template"><div><b>${esc(t.name)}</b><small>${esc(t.plan_name)} · ${t.quantity} seats · ${t.valid_days} days validity</small></div><button class="button small subtle" data-action="template-sub" data-id="${t.id}">Use template</button></div>`).join(""):empty("No templates yet","Create a template for repeatable quotations.")}</div>${table(["Subscription","Customer","Plan","Seats","Recurring total","Status","Next action"],rows,"No subscriptions yet","Start with a customer and a plan.")}`;
}

async function renderInvoices(root) {
 const invoices=await api("/api/invoices");
 const canManage=state.user.role!=="customer";
 const rows=invoices.map(i=>`<tr><td><div class="cell-main">${esc(i.number)}</div><div class="cell-sub">Period ${esc(i.billing_period)}</div></td><td>${esc(i.customer_name)}</td><td>${dateLabel(i.invoice_date)}</td><td>${dateLabel(i.due_date)}${i.overdue?`<div class="cell-sub" style="color:#bd6547">Overdue</div>`:""}</td><td>${money(i.total_amount)}</td><td>${money(i.paid_amount)}</td><td>${badge(i.status)}</td><td><div class="actions-inline">${canManage&&i.status==="draft"?action("Confirm","confirm-invoice",i.id,"subtle"):""}${canManage&&i.status==="confirmed"?action("Record payment","pay",i.id,"primary"):""}${canManage&&["draft","confirmed"].includes(i.status)?action("Cancel","cancel-invoice",i.id,"danger"):""}${action("Print","print",i.id)}</div></td></tr>`).join("");
 root.innerHTML=`${heading("BILLING THAT STAYS IN STEP","Invoices","Clear totals, tax snapshots and payment status.",state.user.role!=="customer"?`<button class="button primary" data-action="run-billing">Run due billing</button>`:"")}${table(["Invoice","Customer","Issued","Due","Total","Paid","Status","Actions"],rows,"No invoices yet","Generate an invoice from an active subscription when it is due.")}${state.user.role!=="customer"?`<div class="subtle-copy">Run due billing to generate invoices for active subscriptions. Each subscription advances to its next billing date and duplicate billing periods are prevented. Email delivery requires your team’s email provider setup; invoices can be printed from this screen.</div>`:""}`;
}

async function renderPayments(root) {
 const rows=await api("/api/payments");
 root.innerHTML=`${heading("MONEY IN, MATCHED","Payments","Every payment is linked to an invoice and its remaining balance.")}${metric("Payments recorded",rows.length,"Across all invoices","◈")}<div style="height:14px"></div>${table(["Payment","Invoice","Date","Method","Amount","Note"],rows.map(p=>`<tr><td><div class="cell-main">PAY-${String(p.id).padStart(5,"0")}</div></td><td>${esc(p.invoice_number)}</td><td>${dateLabel(p.paid_on)}</td><td>${esc(p.method)}</td><td>${money(p.amount)}</td><td>${esc(p.note||"—")}</td></tr>`).join(""),"No payments recorded","When a payment arrives, record it against its invoice.")}`;
}

async function renderDiscounts(root) {
 const [discounts,products]=await Promise.all([api("/api/discounts"),api("/api/products")]); state.cache.products=products;
 root.innerHTML=`${heading("SMARTER PRICING","Discount rules","Create offers that stop when their dates or usage limit run out.",state.user.role==="admin"?`<button class="button primary" data-action="new-discount">＋ Create discount</button>`:"")}${table(["Code","Offer","Applies to","Minimum","Usage","Validity","Status"],discounts.map(d=>`<tr><td><div class="cell-main">${esc(d.code)}</div></td><td>${d.kind==="percent"?`${d.value}% off`:`${money(d.value)} off`}<div class="cell-sub">${esc(d.name)}</div></td><td>${d.product_id?esc(products.find(p=>p.id===d.product_id)?.name||"Product"):"Any product"}</td><td>${money(d.minimum_amount)} · ${d.minimum_quantity} seats</td><td>${d.used_count}${d.usage_limit?` / ${d.usage_limit}`:" / ∞"}</td><td>${d.starts_on?dateLabel(d.starts_on):"Now"}${d.ends_on?` → ${dateLabel(d.ends_on)}`:""}</td><td>${badge(d.active?"active":"closed")}</td></tr>`).join(""),"No discount rules","An admin can create a discount code for eligible subscriptions.")}${state.user.role==="admin"?`<p class="subtle-copy">The first valid discount rule in the system is applied automatically to an eligible invoice. The discount is included before tax and its usage is counted when the invoice is created.</p>`:""}`;
}

async function renderReports(root) {
 const now=new Date(), first=new Date(now.getFullYear(),now.getMonth(),1), fmt=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
 const report=await api(`/api/reports?from=${fmt(first)}&to=${fmt(now)}`); state.cache.report=report;
 root.innerHTML=`${heading("FINANCE, AT A GLANCE","Reports","See collected cash, invoiced revenue and overdue balances.",`<button class="button" data-action="print-report">Print report</button>`)}<div class="report-highlight"><span>Reporting period <b>${dateLabel(report.period.from)} – ${dateLabel(report.period.to)}</b></span><button class="button small" data-action="change-report-dates">Change dates</button></div><div class="cards">${metric("Cash received",money(report.cash_received),"Payments in selected period","↗")}${metric("Invoices issued",money(report.invoiced),"Invoice totals in period","▤")}${metric("Active subscriptions",report.active_subscriptions,"Current recurring accounts","↻")}${metric("Overdue invoices",report.overdue.length,"Outstanding past due date","⌁")}</div><div class="panel-heading"><div><h3>Invoices needing attention</h3><p>Open balances past their due date</p></div></div>${table(["Invoice","Customer","Due date","Original total","Balance"],report.overdue.map(i=>`<tr><td>${esc(i.number)}</td><td>${esc(i.customer_name)}</td><td>${dateLabel(i.due_date)}</td><td>${money(i.total_amount)}</td><td>${money(i.balance)}</td></tr>`).join(""),"All caught up","No overdue invoices in this workspace.")}`;
}

async function renderSettings(root) {
 const [taxes,users]=await Promise.all([api("/api/taxes"),api("/api/users")]); state.cache.users=users;
 root.innerHTML=`${heading("WORKSPACE ADMINISTRATION","Settings","Manage tax defaults and the people who can access Brightloop.")}<div class="split-grid"><section class="info-card"><h3>Tax rules</h3><p>Set the tax rates the team can use when preparing subscriptions. Rates are saved as invoice snapshots.</p><form id="taxForm" class="form-grid"><label>Tax name<input name="name" required placeholder="GST"></label><label>Rate (%)<input name="rate" type="number" min="0" max="100" step="0.001" required placeholder="18"></label><div class="full"><button class="button primary">Add tax rule</button></div></form><div style="height:15px"></div>${taxes.map(t=>`<div class="quote-template"><b>${esc(t.name)}</b><span class="badge active">${t.rate}%</span></div>`).join("")||empty("No tax rules","Add the tax rates used by your business.")}</section><section class="info-card"><h3>Team access</h3><p>Only an administrator can create an internal staff account. Customer registration is self-service.</p><form id="staffForm" class="form-stack"><label>Staff name<input name="name" required></label><label>Work email<input name="email" type="email" required></label><label>Temporary password<input name="password" type="password" minlength="9" required><small>At least 9 characters with uppercase, lowercase and special character.</small></label><button class="button primary">＋ Add staff member</button></form><div style="height:15px"></div>${users.filter(u=>u.role!=="customer").map(u=>`<div class="quote-template"><div><b>${esc(u.name)}</b><small>${esc(u.email)}</small></div>${badge(u.role)}</div>`).join("")}</section></div><section class="info-card" style="margin-top:15px"><h3>Automatic expiry</h3><p>Subscriptions on plans marked for automatic closure close when their expiry date passes. Run the daily housekeeping command from Task Scheduler, or use the button during a demo.</p><button class="button" data-action="auto-close">Run expiry check now</button></section>`;
}

function openModal(title, subtitle, bodyHtml, submitText = "Save") {
 const dialog=$("#modal"); $("#modalContent").innerHTML=`<div class="modal-head"><div><h2>${title}</h2><p>${subtitle}</p></div><button class="modal-close" data-action="close-modal" aria-label="Close">×</button></div><div class="modal-body">${bodyHtml}</div>`;
 dialog.showModal(); const form=$("form",dialog); if(form) form.querySelector("button[type=submit]")?.replaceChildren(document.createTextNode(submitText));
}
function formField(label,name,type="text",opts={}) { return `<label class="${opts.full?"full":""}">${label}${type==="select"?`<select name="${name}" ${opts.required===false?"":"required"}>${opts.options||""}</select>`:type==="textarea"?`<textarea name="${name}" rows="3" ${opts.required===false?"":"required"} placeholder="${opts.placeholder||""}"></textarea>`:`<input name="${name}" type="${type}" ${opts.required===false?"":"required"} ${opts.min!==undefined?`min="${opts.min}"`:""} ${opts.step?`step="${opts.step}"`:""} ${opts.placeholder?`placeholder="${opts.placeholder}"`:""} ${opts.value!==undefined?`value="${opts.value}"`:""}>`}</label>`; }
function planOptions(plans) { return plans.map(p=>`<option value="${p.id}">${esc(p.name)} · ${money(p.price)} / ${esc(p.billing_frequency)}</option>`).join(""); }
function customerOptions(customers) { return customers.map(c=>`<option value="${c.id}">${esc(c.name)} · ${esc(c.email)}</option>`).join(""); }

async function newSubscription(templateId = null) {
 const [plans,products]=await Promise.all([api("/api/plans"),api("/api/products")]); state.cache.plans=plans;state.cache.products=products;
 const variants=products.flatMap(p=>p.variants.map(v=>`<option value="${v.id}" data-product="${p.id}">${esc(p.name)} · ${esc(v.name)} (+${money(v.additional_price)})</option>`)).join("");
 const variantField=`<label>Variant (optional)<select name="variant_id"><option value="">Standard</option>${variants}</select></label>`;
 if(state.user.role==="customer") { openModal("Request a subscription","Choose a plan and we’ll prepare your account.",`<form id="subscriptionForm" class="form-stack">${formField("Plan","plan_id","select",{options:planOptions(plans)})}${variantField}${formField("Seats","quantity","number",{min:1,value:1})}<button class="button primary">Request subscription</button></form>`); filterSubscriptionVariants(); return; }
 const customers=await api("/api/customers"); state.cache.customers=customers;
 if(templateId) { openModal("Create from template","Choose a customer; the plan, quantity and quote validity come from the template.",`<form id="templateSubForm" class="form-stack">${formField("Customer","customer_id","select",{options:customerOptions(customers)})}<button class="button primary">Create quotation</button></form>`); $("#templateSubForm").dataset.template=templateId; return; }
 openModal("New subscription","Start in draft. Move it forward when the quote is ready.",`<form id="subscriptionForm" class="form-stack"><div class="form-grid">${formField("Customer","customer_id","select",{options:customerOptions(customers)})}${formField("Plan","plan_id","select",{options:planOptions(plans)})}${variantField}${formField("Seats","quantity","number",{min:1,value:1})}${formField("Start date","start_date","date",{value:new Date().toISOString().slice(0,10)})}${formField("Expiry date (optional)","expiry_date","date",{required:false})}${formField("Payment terms (days)","payment_terms_days","number",{min:0,value:7})}</div><button class="button primary">Create draft</button></form>`); filterSubscriptionVariants();
}

function filterSubscriptionVariants() {
 const form=$("#subscriptionForm"); if(!form)return; const planSelect=form.elements.plan_id, variantSelect=form.elements.variant_id;
 const apply=()=>{const productId=state.cache.plans.find(p=>p.id===Number(planSelect.value))?.product_id; for(const option of variantSelect.options){if(!option.value)continue;option.hidden=Number(option.dataset.product)!==productId;} if(variantSelect.selectedOptions[0]?.hidden)variantSelect.value="";};
 planSelect.addEventListener("change",apply); apply();
}

function showProductModal() { openModal("Add a product","Set its list price and optional selectable variants.",`<form id="productForm" class="form-stack"><div class="form-grid">${formField("Product name","name","text",{full:true})}${formField("Type","product_type","text",{value:"software"})}${formField("Sales price (₹)","sales_price","number",{min:0,step:"0.01"})}${formField("Cost price (₹)","cost_price","number",{min:0,step:"0.01",value:0})}${formField("Notes","notes","textarea",{full:true,required:false})}${formField("Variants (one per line: Name, extra price)","variants","textarea",{full:true,required:false,placeholder:"Odoo, 560\nEnterprise, 1200"})}</div><button class="button primary">Save product</button></form>`); }
async function showPlanModal() { const products=state.cache.products||await api("/api/products"), taxes=await api("/api/taxes"); openModal("Create a plan","Choose a recurring cycle, tax rule and lifecycle rules.",`<form id="planForm" class="form-stack"><div class="form-grid">${formField("Product","product_id","select",{options:products.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join("")})}${formField("Plan name","name")}${formField("Price per cycle (₹)","price","number",{min:0,step:"0.01"})}${formField("Billing frequency","billing_frequency","select",{options:["daily","weekly","monthly","yearly"].map(x=>`<option>${x}</option>`).join("")})}${formField("Minimum seats","min_quantity","number",{min:1,value:1})}${formField("Tax rule","tax_rule_id","select",{required:false,options:`<option value="">No tax</option>${taxes.map(t=>`<option value="${t.id}">${esc(t.name)} · ${t.rate}%</option>`).join("")}`})}${formField("Available from","available_from","date",{required:false})}${formField("Available until","available_until","date",{required:false})}</div><label><input name="auto_close" type="checkbox"> Automatically close at expiry</label><label><input name="allow_early_close" type="checkbox" checked> Allow early closure</label><button class="button primary">Create plan</button></form>`); }
function showTemplateModal() { const plans=state.cache.plans||[]; openModal("New quote template","Save a reusable starting point for a quotation.",`<form id="templateForm" class="form-stack"><div class="form-grid">${formField("Template name","name")}${formField("Plan","plan_id","select",{options:planOptions(plans)})}${formField("Default seats","quantity","number",{min:1,value:1})}${formField("Valid for (days)","valid_days","number",{min:1,value:14})}</div><button class="button primary">Save template</button></form>`); }
async function showDiscountModal() { const products=state.cache.products||await api("/api/products"); openModal("Create a discount","Discounts apply automatically to the first eligible upcoming invoice.",`<form id="discountForm" class="form-stack"><div class="form-grid">${formField("Discount code","code","text",{placeholder:"GROWTH10"})}${formField("Internal name","name")}${formField("Type","kind","select",{options:`<option value="percent">Percentage</option><option value="fixed">Fixed amount</option>`})}${formField("Value","value","number",{min:0,step:"0.01"})}${formField("Minimum purchase (₹)","minimum_amount","number",{min:0,step:"0.01",value:0})}${formField("Minimum seats","minimum_quantity","number",{min:1,value:1})}${formField("Start date","starts_on","date",{required:false})}${formField("End date","ends_on","date",{required:false})}${formField("Usage limit","usage_limit","number",{min:1,required:false})}${formField("Product scope","product_id","select",{required:false,options:`<option value="">Any product</option>${products.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join("")}`})}</div><button class="button primary">Save discount rule</button></form>`); }

function onFormSubmit(form, fn) { if (!form) return; form.addEventListener("submit", async e => { e.preventDefault(); const button=form.querySelector("button[type=submit],button:not([type])"); if(button) button.disabled=true; try { await fn(new FormData(form)); } catch(error) { toast(error.message,true); if(button)button.disabled=false; } }); }
function dataObject(fd) { const d=Object.fromEntries(fd.entries()); return d; }
function asInt(obj, ...keys) { for(const k of keys) if(obj[k]!==undefined)obj[k]=Number.parseInt(obj[k],10); return obj; }

document.addEventListener("submit", async e => {
 const f=e.target; if(!(f instanceof HTMLFormElement)) return;
 if(f.id==="loginForm") { e.preventDefault(); try { const d=await api("/api/login",{method:"POST",body:JSON.stringify({email:$("#loginEmail").value,password:$("#loginPassword").value})}); state.user=d.user;state.csrf=d.csrf;showApp(); }catch(err){toast(err.message,true);} }
 if(f.id==="registerForm") { e.preventDefault();try{const d=await api("/api/register",{method:"POST",body:JSON.stringify(dataObject(new FormData(f)))});state.user=d.user;state.csrf=d.csrf;state.page="subscriptions";showApp();toast("Welcome to Brightloop.");}catch(err){toast(err.message,true);} }
 if(f.id==="resetForm") {e.preventDefault();try{const d=await api("/api/password-reset/request",{method:"POST",body:JSON.stringify(dataObject(new FormData(f)))});const box=$("#resetResult");box.hidden=false;box.innerHTML=`${esc(d.message)}${d.demo_reset_url?`<a href="${esc(d.demo_reset_url)}">Open one-time reset link →</a>`:""}`;}catch(err){toast(err.message,true);}}
 if(f.id==="subscriptionForm") {e.preventDefault();try{const d=dataObject(new FormData(f));asInt(d,"plan_id","customer_id","quantity","payment_terms_days","variant_id");if(!d.customer_id)d.customer_id=state.user.id;if(!d.variant_id)delete d.variant_id;await api("/api/subscriptions",{method:"POST",body:JSON.stringify(d)});$("#modal").close();toast("Subscription request saved.");renderPage("subscriptions");}catch(err){toast(err.message,true);}}
 if(f.id==="templateSubForm") {e.preventDefault();try{const d=dataObject(new FormData(f));await api(`/api/subscriptions/from-template/${f.dataset.template}`,{method:"POST",body:JSON.stringify(asInt(d,"customer_id"))});$("#modal").close();toast("Quotation created from template.");renderPage("subscriptions");}catch(err){toast(err.message,true);}}
 if(f.id==="productForm") {e.preventDefault();try{const d=dataObject(new FormData(f));d.variants=(d.variants||"").split(/\r?\n/).filter(Boolean).map(row=>{const [name,price="0"]=row.split(",");return{name:name.trim(),additional_price:Number(price.trim())};});d.sales_price=Number(d.sales_price);d.cost_price=Number(d.cost_price);await api("/api/products",{method:"POST",body:JSON.stringify(d)});$("#modal").close();toast("Product created.");renderPage("catalog");}catch(err){toast(err.message,true);}}
 if(f.id==="planForm") {e.preventDefault();try{const d=dataObject(new FormData(f));asInt(d,"product_id","min_quantity");d.price=Number(d.price);d.tax_rate=Number(d.tax_rate);d.auto_close=f.elements.auto_close.checked;d.allow_early_close=f.elements.allow_early_close.checked;await api("/api/plans",{method:"POST",body:JSON.stringify(d)});$("#modal").close();toast("Plan created.");renderPage("catalog");}catch(err){toast(err.message,true);}}
 if(f.id==="templateForm") {e.preventDefault();try{const d=dataObject(new FormData(f));asInt(d,"plan_id","quantity","valid_days");await api("/api/quote-templates",{method:"POST",body:JSON.stringify(d)});$("#modal").close();toast("Quote template saved.");renderPage("subscriptions");}catch(err){toast(err.message,true);}}
 if(f.id==="discountForm") {e.preventDefault();try{const d=dataObject(new FormData(f));asInt(d,"minimum_quantity","usage_limit","product_id");d.value=Number(d.value);d.minimum_amount=Number(d.minimum_amount);if(!d.product_id)delete d.product_id;if(!d.usage_limit)delete d.usage_limit;await api("/api/discounts",{method:"POST",body:JSON.stringify(d)});$("#modal").close();toast("Discount rule saved.");renderPage("discounts");}catch(err){toast(err.message,true);}}
 if(f.id==="taxForm") {e.preventDefault();try{const d=dataObject(new FormData(f));d.rate=Number(d.rate);await api("/api/taxes",{method:"POST",body:JSON.stringify(d)});toast("Tax rule added.");renderPage("settings");}catch(err){toast(err.message,true);}}
 if(f.id==="staffForm") {e.preventDefault();try{await api("/api/staff",{method:"POST",body:JSON.stringify(dataObject(new FormData(f)))});toast("Staff account created.");renderPage("settings");}catch(err){toast(err.message,true);}}
 if(f.id==="paymentForm") {e.preventDefault();try{const d=dataObject(new FormData(f));asInt(d,"invoice_id");d.amount=Number(d.amount);await api("/api/payments",{method:"POST",body:JSON.stringify(d)});$("#modal").close();toast("Payment recorded and matched.");renderPage("invoices");}catch(err){toast(err.message,true);}}
 if(f.id==="reportDateForm") {e.preventDefault();const d=dataObject(new FormData(f));renderReportDates(d.from,d.to);}
});

document.addEventListener("click", async e => {
 const pageButton=e.target.closest("[data-page]"); if(pageButton){setPage(pageButton.dataset.page);return;}
 const b=e.target.closest("[data-action]"); if(!b)return; const id=b.dataset.id, act=b.dataset.action;
 try {
  if(act.startsWith("show-")){showAuth(({"show-login":"signInPanel","show-register":"registerPanel","show-reset":"resetPanel"})[act]);return;}
  if(act==="close-modal"){ $("#modal").close();return; }
  if(act==="logout"){await api("/api/logout",{method:"POST"});state.user=null;state.csrf="";showAuth();return;}
  if(act==="catalog-tab"){const products=state.cache.products||await api("/api/products");$(".section-tabs").querySelectorAll("button").forEach(x=>x.classList.toggle("active",x.dataset.tab===b.dataset.tab));$("#catalogContent").innerHTML=b.dataset.tab==="plans"?table(["Plan","Price","Billing","Minimum seats","Auto close","Early close"],(state.cache.plans||[]).map(p=>`<tr><td><div class="cell-main">${esc(p.name)}</div><div class="cell-sub">${esc(p.product_name)}</div></td><td>${money(p.price)}</td><td>${esc(p.billing_frequency)}</td><td>${p.min_quantity}</td><td>${p.auto_close?"Yes":"No"}</td><td>${p.allow_early_close?"Yes":"No"}</td></tr>`).join("")):catalogProductsTable(products.map(p=>`<tr><td><div class="cell-main">${esc(p.name)}</div><div class="cell-sub">${esc(p.product_type)}</div></td><td>${money(p.sales_price)}</td><td>${p.variants.map(v=>`${esc(v.name)} +${money(v.additional_price)}`).join(" · ")||"—"}</td><td>${esc(p.notes||"—")}</td></tr>`).join(""));return;}
  if(act==="new-subscription"){await newSubscription();return;} if(act==="new-product"){showProductModal();return;} if(act==="new-plan"){await showPlanModal();return;} if(act==="new-template"){showTemplateModal();return;} if(act==="new-discount"){await showDiscountModal();return;}
  if(act==="template-sub"){await newSubscription(id);return;}
  if(act==="status"){await api(`/api/subscriptions/${id}/status`,{method:"PUT",body:JSON.stringify({status:"quotation"})});toast("Quotation stage updated.");renderPage("subscriptions");return;}
  if(act==="status-confirm"){await api(`/api/subscriptions/${id}/status`,{method:"PUT",body:JSON.stringify({status:"confirmed"})});toast("Subscription confirmed.");renderPage("subscriptions");return;}
  if(act==="status-activate"){await api(`/api/subscriptions/${id}/status`,{method:"PUT",body:JSON.stringify({status:"active"})});toast("Subscription is active.");renderPage("subscriptions");return;}
  if(["pause","resume","close","renew"].includes(act)){if(act==="close"&&!window.confirm("Close this subscription now? This stops future billing and the account can be renewed later."))return;const endpoint=act==="close"?"close":act;await api(`/api/subscriptions/${id}/${endpoint}`,{method:"POST"});toast(act==="renew"?"Renewal draft created.":`Subscription ${act==="close"?"closed":act+"d"}.`);renderPage("subscriptions");return;}
  if(act==="invoice"){await api(`/api/subscriptions/${id}/invoice`,{method:"POST",body:JSON.stringify({})});toast("Invoice generated for the due billing period.");renderPage("invoices");return;}
  if(act==="confirm-invoice"){await api(`/api/invoices/${id}/confirm`,{method:"POST",body:JSON.stringify({})});toast("Invoice confirmed.");renderPage("invoices");return;}
  if(act==="cancel-invoice"){if(!window.confirm("Cancel this unpaid invoice? It cannot be paid after cancellation."))return;await api(`/api/invoices/${id}/cancel`,{method:"POST",body:JSON.stringify({})});toast("Invoice cancelled.");renderPage("invoices");return;}
  if(act==="run-billing"){const result=await api("/api/billing/run",{method:"POST",body:JSON.stringify({})});toast(`${result.created} invoice(s) created · ${result.still_due} subscription(s) still due.`);renderPage("invoices");return;}
  if(act==="pay"){const open=await api("/api/invoices");const invoice=open.find(x=>x.id===Number(id));openModal(`Record payment · ${esc(invoice.number)}`,`Outstanding balance: ${money(invoice.balance)}`,`<form id="paymentForm" class="form-stack"><input type="hidden" name="invoice_id" value="${invoice.id}"><div class="form-grid">${formField("Amount (₹)","amount","number",{min:"0.01",step:"0.01",value:invoice.balance})}${formField("Payment method","method","select",{options:["UPI","Bank transfer","Card","Cash","Other"].map(x=>`<option>${x}</option>`).join("")})}${formField("Date received","paid_on","date",{value:new Date().toISOString().slice(0,10)})}${formField("Note","note","text",{required:false})}</div><button class="button primary">Save payment</button></form>`);return;}
  if(act==="auto-close"){const r=await api("/api/subscriptions/auto-close",{method:"POST",body:JSON.stringify({})});toast(`${r.closed} expired subscription(s) closed.`);renderPage("settings");return;}
  if(act==="change-report-dates"){openModal("Choose report dates","Cash received and invoices issued within this period.",`<form id="reportDateForm" class="form-stack"><div class="form-grid">${formField("From","from","date",{value:state.cache.report.period.from})}${formField("To","to","date",{value:state.cache.report.period.to})}</div><button class="button primary">Update report</button></form>`);return;}
  if(act==="print-report"){window.print();return;}
  if(act==="print"){const inv=(await api("/api/invoices")).find(x=>x.id===Number(id));printInvoice(inv);return;}
  if(act==="customer-subs"){state.customerFilter=Number(id);setPage("subscriptions");return;}
 } catch(error) {toast(error.message,true);}
});

async function renderReportDates(from,to){try{const d=await api(`/api/reports?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);state.cache.report=d;$("#modal").close();renderPage("reports");}catch(err){toast(err.message,true);}}
function printInvoice(i){const w=window.open("","_blank","width=780,height=900");if(!w)return toast("Allow pop-ups to print this invoice.",true);w.document.write(`<!doctype html><html><head><title>${esc(i.number)}</title><style>body{font:14px Arial,sans-serif;color:#222;padding:48px}.top{display:flex;justify-content:space-between;border-bottom:2px solid #7454d9;padding-bottom:18px}h1{margin:0;color:#372b62}table{border-collapse:collapse;width:100%;margin-top:30px}td{padding:12px;border-bottom:1px solid #ddd}.total{text-align:right;font-size:19px;font-weight:bold;margin-top:18px}.muted{color:#777;font-size:12px}</style></head><body><div class="top"><div><h1>brightloop</h1><p class="muted">Subscription invoice</p></div><div><b>${esc(i.number)}</b><p class="muted">Issued ${dateLabel(i.invoice_date)} · Due ${dateLabel(i.due_date)}</p></div></div><p><b>Bill to</b><br>${esc(i.customer_name)}</p><table><tr><td>Subscription service · ${esc(i.billing_period)}</td><td>${money(i.subtotal)}</td></tr><tr><td>Discount</td><td>− ${money(i.discount_amount)}</td></tr><tr><td>Tax</td><td>${money(i.tax_amount)}</td></tr></table><div class="total">Total ${money(i.total_amount)}</div><p class="muted">Status: ${esc(i.status)} · Balance due: ${money(i.balance)}</p><script>window.print()<\/script></body></html>`);w.document.close();}

document.addEventListener("click", e => { const b=e.target.closest("[data-action]"); if(b?.dataset.action==="show-reset") {$("#resetResult").hidden=true;} });

async function boot() {
  const params=new URLSearchParams(location.search);
  if(params.has("reset")) { showAuth("resetPanel");const token=params.get("reset");openModal("Choose a new password","Your one-time link is ready. Set your new password.",`<form id="completeResetForm" class="form-stack"><input type="hidden" name="token" value="${esc(token)}">${formField("New password","password","password")}<button class="button primary">Update password</button></form>`); $("#completeResetForm")?.addEventListener("submit",async e=>{e.preventDefault();try{await api("/api/password-reset/complete",{method:"POST",body:JSON.stringify(dataObject(new FormData(e.target)))});$("#modal").close();history.replaceState({},"", "/");state.user=null;state.csrf="";showAuth();toast("Password updated. Sign in with your new password.");}catch(err){toast(err.message,true);}}); return; }
  try { const d=await api("/api/me"); state.user=d.user; state.csrf=d.csrf; showApp(); }
  catch { showAuth(); }
}

document.addEventListener("click", e=>{const b=e.target.closest("[data-page]");if(b&&b.classList.contains("link-button"))setPage(b.dataset.page);});
boot();
