/* =====================================================
   BRIGHTLOOP - SUBSCRIPTION MANAGEMENT SYSTEM
   Dashboard + Customers + Products + Subscriptions
   + Invoices + Payments
   Data storage: Browser localStorage
===================================================== */


/* =====================================================
   1. INITIAL SETUP
===================================================== */

const navLinks = document.querySelectorAll(".nav-link");
const mainContent = document.querySelector(".main-content");

const dashboardHTML = mainContent.innerHTML;


/* =====================================================
   2. DATA STORAGE
===================================================== */

let customers = JSON.parse(
    localStorage.getItem("brightloopCustomers")
) || [
    {
        name: "Acme Studio",
        email: "hello@acmestudio.com",
        phone: "+91 9876543210",
        status: "Active"
    },
    {
        name: "Northstar Tech",
        email: "contact@northstar.com",
        phone: "+91 9876543211",
        status: "Active"
    },
    {
        name: "Greenfield Co.",
        email: "info@greenfield.com",
        phone: "+91 9876543212",
        status: "Inactive"
    }
];

let products = JSON.parse(
    localStorage.getItem("brightloopProducts")
) || [];

let subscriptions = JSON.parse(
    localStorage.getItem("brightloopSubscriptions")
) || [];

let invoices = JSON.parse(
    localStorage.getItem("brightloopInvoices")
) || [];

let payments = JSON.parse(
    localStorage.getItem("brightloopPayments")
) || [];

let discounts = JSON.parse(
    localStorage.getItem("brightloopDiscounts")
) || [];


function saveCustomersToStorage() {
    localStorage.setItem("brightloopCustomers", JSON.stringify(customers));
}

function saveProductsToStorage() {
    localStorage.setItem("brightloopProducts", JSON.stringify(products));
}

function saveSubscriptionsToStorage() {
    localStorage.setItem("brightloopSubscriptions", JSON.stringify(subscriptions));
}

function saveInvoicesToStorage() {
    localStorage.setItem("brightloopInvoices", JSON.stringify(invoices));
}

function savePaymentsToStorage() {
    localStorage.setItem("brightloopPayments", JSON.stringify(payments));
}

function saveDiscountsToStorage() {
    localStorage.setItem("brightloopDiscounts", JSON.stringify(discounts));
}

/* =====================================================
   3. SIDEBAR NAVIGATION
===================================================== */

navLinks.forEach(link => {

    link.addEventListener("click", function(event) {

        event.preventDefault();

        navLinks.forEach(nav => nav.classList.remove("active"));

        this.classList.add("active");

        showPage(this.dataset.page);
    });

});


/* =====================================================
   4. PAGE NAVIGATION
===================================================== */

function activateSidebarPage(pageName) {

    navLinks.forEach(link => {
        link.classList.toggle(
            "active",
            link.dataset.page === pageName
        );
    });

}


function showPage(pageName) {

    localStorage.setItem("brightloopCurrentPage", pageName);

    if (pageName === "Dashboard") {
        mainContent.innerHTML = dashboardHTML;
        renderDashboardStats();
        renderDashboardRevenueChart();
        return;
    }

    if (pageName === "Customers") {
        showCustomersPage();
        return;
    }

    if (
        pageName === "Products" ||
        pageName === "Products & Plans"
    ) {
        showProductsPage();
        return;
    }

    if (pageName === "Subscriptions") {
        showSubscriptionsPage();
        return;
    }

    if (pageName === "Invoices") {
        showInvoicesPage();
        return;
    }

    if (pageName === "Payments") {
        showPaymentsPage();
        return;
    }

    if (pageName === "Discounts") {
        showDiscountsPage();
        return;
    }
    if (pageName === "Reports") {
        showReportsPage();
        return;
    }
    if (pageName === "Settings") {
        showSettingsPage();
        return;
    }
    
    showPlaceholderPage(pageName);
}


/* =====================================================
   5. CUSTOMERS MODULE
===================================================== */

function showCustomersPage() {

    mainContent.innerHTML = `

        <header class="topbar">
            <div class="search-box">
                <span>⌕</span>
                <input type="text" id="customerSearch"
                    placeholder="Search customers...">
            </div>
        </header>

        <section class="welcome-section">
            <div>
                <p class="eyebrow">WORKSPACE</p>
                <h1>Customers</h1>
                <p class="subtitle">
                    Manage and keep track of your customers.
                </p>
            </div>

            <button class="date-button" id="addCustomerBtn">
                + Add Customer
            </button>
        </section>

        <section class="content-card">
            <h3>All Customers</h3>
            <p class="subtitle">
                View and manage your customer information.
            </p>

            <table>
                <thead>
                    <tr>
                        <th>Customer Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="customerTableBody"></tbody>
            </table>
        </section>

        <footer>© 2026 Brightloop Software</footer>
    `;
    const chartContainer = document.getElementById("monthlyRevenueChart");

    const monthlyRevenue = {};

    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setDate(1);
        date.setMonth(date.getMonth() - i);

        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

        monthlyRevenue[key] = {
            label: date.toLocaleString("en-IN", { month: "short" }),
            amount: 0
        };
    }

    invoices.forEach(invoice => {
        if (!invoice.issueDate) return;

        const date = new Date(invoice.issueDate + "T00:00:00");
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

        if (monthlyRevenue[key]) {
            monthlyRevenue[key].amount += Number(invoice.amountPaid || 0);
        }
    });

    const maxRevenue = Math.max(
        1,
        ...Object.values(monthlyRevenue).map(item => item.amount)
    );

    chartContainer.innerHTML = Object.values(monthlyRevenue).map(item => {

        const height = (item.amount / maxRevenue) * 100;

        return `
            <div class="revenue-bar-item">
                <div class="revenue-bar-value">${formatPrice(item.amount)}</div>
                <div class="revenue-bar-track">
                    <div class="revenue-bar-fill" style="height: ${height}%"></div>
                </div>
                <span>${item.label}</span>
            </div>
        `;
    }).join("");

    renderCustomers();

    document.getElementById("addCustomerBtn")
        .addEventListener("click", () => openCustomerModal());

    document.getElementById("customerSearch")
        .addEventListener("input", searchCustomers);

    document.getElementById("customerTableBody")
        .addEventListener("click", event => {

            const button = event.target.closest("button");
            if (!button) return;

            const index = Number(button.dataset.index);

            if (button.classList.contains("edit-btn")) {
                openCustomerModal(index);
            }

            if (button.classList.contains("delete-btn")) {
                deleteCustomer(index);
            }
        });
}


function renderCustomers(customerList = customers) {

    const tableBody = document.getElementById("customerTableBody");
    if (!tableBody) return;

    tableBody.innerHTML = "";

    if (!customerList.length) {
        tableBody.innerHTML = `
            <tr><td colspan="5">No customers found.</td></tr>
        `;
        return;
    }

    customerList.forEach(customer => {

        const index = customers.indexOf(customer);
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHTML(customer.name)}</td>
            <td>${escapeHTML(customer.email)}</td>
            <td>${escapeHTML(customer.phone)}</td>
            <td>
                <span class="status ${
                    customer.status === "Active" ? "active" : "pending"
                }">
                    ${escapeHTML(customer.status)}
                </span>
            </td>
            <td>
                <button class="customer-action-btn edit-btn"
                    data-index="${index}">Edit</button>
                <button class="customer-action-btn delete-btn"
                    data-index="${index}">Delete</button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}


function openCustomerModal(customerIndex = null) {

    if (document.getElementById("customerModal")) return;

    const isEditing = customerIndex !== null;
    const customer = isEditing ? customers[customerIndex] : null;

    if (isEditing && !customer) return;

    const modal = document.createElement("div");
    modal.id = "customerModal";
    modal.className = "customer-modal-overlay";

    modal.innerHTML = `
        <div class="customer-modal">

            <div class="modal-header">
                <div>
                    <h2>${isEditing ? "Edit Customer" : "Add New Customer"}</h2>
                    <p>Enter the customer information below.</p>
                </div>

                <button type="button" class="modal-close"
                    id="closeCustomerModal">&times;</button>
            </div>

            <form id="customerForm">

                <div class="form-group">
                    <label>Customer Name</label>
                    <input type="text" id="customerName"
                        placeholder="Enter customer name" required>
                </div>

                <div class="form-group">
                    <label>Email Address</label>
                    <input type="email" id="customerEmail"
                        placeholder="Enter email address" required>
                </div>

                <div class="form-group">
                    <label>Phone Number</label>
                    <input type="tel" id="customerPhone"
                        placeholder="Enter phone number" required>
                </div>

                <div class="form-group">
                    <label>Customer Status</label>
                    <select id="customerStatus">
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </div>

                <div class="modal-actions">
                    <button type="button" id="cancelCustomer">Cancel</button>
                    <button type="submit">
                        ${isEditing ? "Update Customer" : "Save Customer"}
                    </button>
                </div>

            </form>
        </div>
    `;

    document.body.appendChild(modal);

    if (isEditing) {
        document.getElementById("customerName").value = customer.name;
        document.getElementById("customerEmail").value = customer.email;
        document.getElementById("customerPhone").value = customer.phone;
        document.getElementById("customerStatus").value = customer.status;
    }

    document.getElementById("closeCustomerModal")
        .addEventListener("click", closeCustomerModal);

    document.getElementById("cancelCustomer")
        .addEventListener("click", closeCustomerModal);

    document.getElementById("customerForm")
        .addEventListener("submit", event => {
            saveCustomer(event, customerIndex);
        });

    modal.addEventListener("click", event => {
        if (event.target === modal) closeCustomerModal();
    });
}


function saveCustomer(event, customerIndex = null) {

    event.preventDefault();

    const name = document.getElementById("customerName").value.trim();
    const email = document.getElementById("customerEmail").value.trim();
    const phone = document.getElementById("customerPhone").value.trim();
    const status = document.getElementById("customerStatus").value;

    if (name.length < 2) {
        alert("Please enter a valid customer name.");
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert("Please enter a valid email address.");
        return;
    }

    if (!/^[+0-9()\-\s]{7,20}$/.test(phone)) {
        alert("Please enter a valid phone number.");
        return;
    }

    const emailExists = customers.some((item, index) =>
        item.email.toLowerCase() === email.toLowerCase() &&
        index !== customerIndex
    );

    if (emailExists) {
        alert("A customer with this email already exists.");
        return;
    }

    const customerData = { name, email, phone, status };

    if (customerIndex !== null) {
        customers[customerIndex] = customerData;
    } else {
        customers.push(customerData);
    }

    saveCustomersToStorage();
    closeCustomerModal();
    searchCustomers();

    alert(customerIndex !== null
        ? "Customer updated successfully!"
        : "Customer added successfully!");
}


function closeCustomerModal() {
    document.getElementById("customerModal")?.remove();
}


function deleteCustomer(index) {

    const customer = customers[index];
    if (!customer) return;

    const isUsed = subscriptions.some(
        subscription => subscription.customerEmail === customer.email
    );

    if (isUsed) {
        alert("This customer is linked to a subscription. Please keep this customer record.");
        return;
    }

    if (!confirm(`Delete ${customer.name}?`)) return;

    customers.splice(index, 1);
    saveCustomersToStorage();
    searchCustomers();
}


function searchCustomers() {

    const input = document.getElementById("customerSearch");
    if (!input) return;

    const value = input.value.toLowerCase().trim();

    const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(value) ||
        customer.email.toLowerCase().includes(value) ||
        customer.phone.toLowerCase().includes(value)
    );

    renderCustomers(filtered);
}


/* =====================================================
   6. PRODUCTS MODULE
===================================================== */

function showProductsPage() {

    mainContent.innerHTML = `

        <header class="topbar">
            <div class="search-box">
                <span>⌕</span>
                <input type="text" id="productSearch"
                    placeholder="Search products...">
            </div>
        </header>

        <section class="welcome-section">
            <div>
                <p class="eyebrow">WORKSPACE</p>
                <h1>Products & Plans</h1>
                <p class="subtitle">
                    Manage your products, pricing and variants.
                </p>
            </div>

            <button class="date-button" id="addProductBtn">
                + Add Product
            </button>
        </section>

        <section class="content-card">
            <h3>All Products</h3>
            <p class="subtitle">Your product catalogue.</p>

            <table>
                <thead>
                    <tr>
                        <th>Product Name</th>
                        <th>Type</th>
                        <th>Sales Price</th>
                        <th>Cost Price</th>
                        <th>Variants</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="productTableBody"></tbody>
            </table>
        </section>

        <footer>© 2026 Brightloop Software</footer>
    `;

    renderProducts();

    document.getElementById("addProductBtn")
        .addEventListener("click", () => openProductModal());

    document.getElementById("productSearch")
        .addEventListener("input", searchProducts);

    document.getElementById("productTableBody")
        .addEventListener("click", event => {

            const button = event.target.closest("button");
            if (!button) return;

            const index = Number(button.dataset.index);

            if (button.classList.contains("edit-btn")) {
                openProductModal(index);
            }

            if (button.classList.contains("delete-btn")) {
                deleteProduct(index);
            }
        });
}


function renderProducts(productList = products) {

    const tableBody = document.getElementById("productTableBody");
    if (!tableBody) return;

    tableBody.innerHTML = "";

    if (!productList.length) {
        tableBody.innerHTML = `
            <tr><td colspan="6">No products found. Add your first product!</td></tr>
        `;
        return;
    }

    productList.forEach(product => {

        const index = products.indexOf(product);
        const variants = product.variants || [];

        const variantDisplay = variants.length
            ? `<span class="variant-count">${variants.length} variant(s)</span>
               <small class="variant-preview">${variants.map(v => escapeHTML(v.name)).join(", ")}</small>`
            : `<span class="variant-count empty">No variants</span>`;

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHTML(product.name)}</td>
            <td>${escapeHTML(product.type)}</td>
            <td>${formatPrice(product.salesPrice)}</td>
            <td>${formatPrice(product.costPrice)}</td>
            <td>${variantDisplay}</td>
            <td>
                <button class="customer-action-btn edit-btn"
                    data-index="${index}">Edit</button>
                <button class="customer-action-btn delete-btn"
                    data-index="${index}">Delete</button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}


function openProductModal(productIndex = null) {

    if (document.getElementById("productModal")) return;

    const isEditing = productIndex !== null;
    const product = isEditing ? products[productIndex] : null;

    if (isEditing && !product) return;

    const modal = document.createElement("div");
    modal.id = "productModal";
    modal.className = "customer-modal-overlay";

    modal.innerHTML = `

        <div class="customer-modal">

            <div class="modal-header">
                <div>
                    <h2>${isEditing ? "Edit Product" : "Add New Product"}</h2>
                    <p>Enter product information below.</p>
                </div>

                <button type="button" class="modal-close"
                    id="closeProductModal">&times;</button>
            </div>

            <form id="productForm">

                <div class="form-group">
                    <label>Product Name</label>
                    <input type="text" id="productName"
                        placeholder="e.g. Brightloop CRM" required>
                </div>

                <div class="form-group">
                    <label>Product Type</label>
                    <select id="productType" required>
                        <option value="">Select product type</option>
                        <option value="Service">Service</option>
                        <option value="Software">Software</option>
                        <option value="Physical">Physical Product</option>
                        <option value="Digital">Digital Product</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Sales Price (₹)</label>
                    <input type="number" id="salesPrice"
                        min="0" step="0.01" required>
                </div>

                <div class="form-group">
                    <label>Cost Price (₹)</label>
                    <input type="number" id="costPrice"
                        min="0" step="0.01" required>
                </div>

                <div class="form-group">
                    <label>Notes</label>
                    <textarea id="productNotes" rows="3"
                        placeholder="Additional product information"></textarea>
                </div>

                <section class="variants-section">

                    <div class="variants-heading">
                        <div>
                            <h3>Product Variants</h3>
                            <p>Add versions with additional pricing.</p>
                        </div>

                        <button type="button" class="add-variant-btn"
                            id="addVariantBtn">+ Add Variant</button>
                    </div>

                    <div class="variant-label-row">
                        <span>Variant Name</span>
                        <span>Additional Price (₹)</span>
                        <span></span>
                    </div>

                    <div id="variantRows"></div>

                    <p class="variant-help">
                        Example: Premium version with ₹560 additional price.
                    </p>

                </section>

                <div class="modal-actions">
                    <button type="button" id="cancelProduct">Cancel</button>
                    <button type="submit">
                        ${isEditing ? "Update Product" : "Save Product"}
                    </button>
                </div>

            </form>
        </div>
    `;

    document.body.appendChild(modal);

    if (isEditing) {
        document.getElementById("productName").value = product.name;
        document.getElementById("productType").value = product.type;
        document.getElementById("salesPrice").value = product.salesPrice;
        document.getElementById("costPrice").value = product.costPrice;
        document.getElementById("productNotes").value = product.notes || "";

        (product.variants || []).forEach(variant => addVariantRow(variant));
    }

    document.getElementById("closeProductModal")
        .addEventListener("click", closeProductModal);

    document.getElementById("cancelProduct")
        .addEventListener("click", closeProductModal);

    document.getElementById("addVariantBtn")
        .addEventListener("click", () => addVariantRow());

    document.getElementById("productForm")
        .addEventListener("submit", event => {
            saveProduct(event, productIndex);
        });

    modal.addEventListener("click", event => {
        if (event.target === modal) closeProductModal();
    });
}


function addVariantRow(variant = null) {

    const variantRows = document.getElementById("variantRows");
    if (!variantRows) return;

    const row = document.createElement("div");
    row.className = "variant-row";

    row.innerHTML = `
        <input type="text" class="variant-name"
            placeholder="e.g. Premium"
            value="${variant ? escapeHTML(variant.name) : ""}">

        <input type="number" class="variant-price"
            min="0" step="0.01" placeholder="e.g. 560"
            value="${variant ? Number(variant.priceAddon) : ""}">

        <button type="button" class="remove-variant-btn"
            title="Remove variant">&times;</button>
    `;

    row.querySelector(".remove-variant-btn")
        .addEventListener("click", () => row.remove());

    variantRows.appendChild(row);
}


function saveProduct(event, productIndex = null) {

    event.preventDefault();

    const name = document.getElementById("productName").value.trim();
    const type = document.getElementById("productType").value;
    const salesPrice = Number(document.getElementById("salesPrice").value);
    const costPrice = Number(document.getElementById("costPrice").value);
    const notes = document.getElementById("productNotes").value.trim();

    if (name.length < 2 || !type) {
        alert("Please enter a valid product name and type.");
        return;
    }

    if (
        !Number.isFinite(salesPrice) ||
        !Number.isFinite(costPrice) ||
        salesPrice < 0 ||
        costPrice < 0
    ) {
        alert("Please enter valid prices.");
        return;
    }

    const duplicate = products.some((product, index) =>
        product.name.toLowerCase() === name.toLowerCase() &&
        index !== productIndex
    );

    if (duplicate) {
        alert("A product with this name already exists.");
        return;
    }

    const variants = [];
    const variantNames = new Set();

    document.querySelectorAll("#variantRows .variant-row")
        .forEach(row => {

            const variantName = row.querySelector(".variant-name").value.trim();
            const priceValue = row.querySelector(".variant-price").value.trim();

            if (!variantName && !priceValue) return;

            if (!variantName || priceValue === "") {
                variants.push({ invalid: true });
                return;
            }

            const priceAddon = Number(priceValue);

            if (
                !Number.isFinite(priceAddon) ||
                priceAddon < 0 ||
                variantNames.has(variantName.toLowerCase())
            ) {
                variants.push({ invalid: true });
                return;
            }

            variantNames.add(variantName.toLowerCase());
            variants.push({ name: variantName, priceAddon });
        });

    if (variants.some(v => v.invalid)) {
        alert("Check your variants. Names must be unique and prices valid.");
        return;
    }

    const productData = {
        name,
        type,
        salesPrice,
        costPrice,
        notes,
        variants
    };

    if (productIndex !== null) {
        products[productIndex] = productData;
    } else {
        products.push(productData);
    }

    saveProductsToStorage();
    closeProductModal();
    searchProducts();

    alert(productIndex !== null
        ? "Product updated successfully!"
        : "Product added successfully!");
}


function closeProductModal() {
    document.getElementById("productModal")?.remove();
}


function deleteProduct(index) {

    const product = products[index];
    if (!product) return;

    const isUsed = subscriptions.some(
        subscription => subscription.productName === product.name
    );

    if (isUsed) {
        alert("This product is linked to a subscription. Please keep it in your catalogue.");
        return;
    }

    if (!confirm(`Delete ${product.name}?`)) return;

    products.splice(index, 1);
    saveProductsToStorage();
    searchProducts();
}


function searchProducts() {

    const input = document.getElementById("productSearch");
    if (!input) return;

    const value = input.value.toLowerCase().trim();

    const filtered = products.filter(product =>
        product.name.toLowerCase().includes(value) ||
        product.type.toLowerCase().includes(value) ||
        (product.variants || []).some(variant =>
            variant.name.toLowerCase().includes(value)
        )
    );

    renderProducts(filtered);
}
/* =====================================================
   7. SUBSCRIPTIONS MODULE
===================================================== */

function showSubscriptionsPage() {

    mainContent.innerHTML = `

        <header class="topbar">
            <div class="search-box">
                <span>⌕</span>
                <input type="text" id="subscriptionSearch"
                    placeholder="Search subscriptions...">
            </div>
        </header>

        <section class="welcome-section">
            <div>
                <p class="eyebrow">WORKSPACE</p>
                <h1>Subscriptions</h1>
                <p class="subtitle">
                    Create and manage customer subscriptions.
                </p>
            </div>

            <button class="date-button" id="addSubscriptionBtn">
                + New Subscription
            </button>
        </section>

        <section class="stats-grid subscription-stats">

            <div class="stat-card purple">
                <p>Total Subscriptions</p>
                <h2 id="totalSubscriptions">0</h2>
                <span>All subscription records</span>
            </div>

            <div class="stat-card green">
                <p>Active</p>
                <h2 id="activeSubscriptions">0</h2>
                <span>Currently active</span>
            </div>

            <div class="stat-card orange">
                <p>Pending</p>
                <h2 id="pendingSubscriptions">0</h2>
                <span>Draft and quotation</span>
            </div>

            <div class="stat-card pink">
                <p>Monthly Value</p>
                <h2 id="monthlySubscriptionValue">₹0</h2>
                <span>Estimated monthly equivalent</span>
            </div>

        </section>

        <section class="content-card subscriptions-section">

            <h3>All Subscriptions</h3>
            <p class="subtitle">
                Track customer plans, billing and subscription stages.
            </p>

            <table>
                <thead>
                    <tr>
                        <th>Subscription ID</th>
                        <th>Customer</th>
                        <th>Product / Plan</th>
                        <th>Quantity</th>
                        <th>Billing</th>
                        <th>Amount</th>
                        <th>Next Billing</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>

                <tbody id="subscriptionTableBody"></tbody>
            </table>

        </section>

        <footer>© 2026 Brightloop Software</footer>
    `;

    renderSubscriptions();

    document.getElementById("addSubscriptionBtn")
        .addEventListener("click", () => openSubscriptionModal());

    document.getElementById("subscriptionSearch")
        .addEventListener("input", searchSubscriptions);

    document.getElementById("subscriptionTableBody")
        .addEventListener("click", event => {

            const button = event.target.closest("button");
            if (!button) return;

            const index = Number(button.dataset.index);

            if (button.classList.contains("edit-btn")) {
                openSubscriptionModal(index);
            }

            if (button.classList.contains("delete-btn")) {
                deleteSubscription(index);
            }

            if (button.classList.contains("generate-invoice-btn")) {
                generateInvoice(index);
            }
        });
}


function renderSubscriptions(subscriptionList = subscriptions) {

    const tableBody = document.getElementById("subscriptionTableBody");
    if (!tableBody) return;

    tableBody.innerHTML = "";

    if (!subscriptionList.length) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9">
                    No subscriptions found. Create your first subscription!
                </td>
            </tr>
        `;
        updateSubscriptionStats();
        return;
    }

    subscriptionList.forEach(subscription => {

        const index = subscriptions.indexOf(subscription);
        const statusClass = subscription.status.toLowerCase()
            .replace(/\s+/g, "-");

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHTML(subscription.id)}</td>
            <td>${escapeHTML(subscription.customerName)}</td>
            <td>
                ${escapeHTML(subscription.productName)}
                ${subscription.variantName
                    ? `<small class="variant-preview">${escapeHTML(subscription.variantName)}</small>`
                    : ""}
            </td>
            <td>${subscription.quantity}</td>
            <td>${escapeHTML(subscription.frequency)}</td>
            <td>${formatPrice(subscription.totalAmount)}</td>
            <td>${formatDate(subscription.nextBilling)}</td>
            <td>
                <span class="status ${statusClass}">
                    ${escapeHTML(subscription.status)}
                </span>
            </td>
            <td>
                <button class="customer-action-btn edit-btn"
                    data-index="${index}">Edit</button>

                <button class="customer-action-btn generate-invoice-btn"
                    data-index="${index}">Invoice</button>

                <button class="customer-action-btn delete-btn"
                    data-index="${index}">Delete</button>
            </td>
        `;

        tableBody.appendChild(row);
    });

    updateSubscriptionStats();
}


function updateSubscriptionStats() {

    const total = subscriptions.length;

    const active = subscriptions.filter(
        item => item.status === "Active"
    ).length;

    const pending = subscriptions.filter(
        item => ["Draft", "Quotation", "Confirmed"].includes(item.status)
    ).length;

    const monthlyValue = subscriptions
        .filter(item => item.status === "Active")
        .reduce((sum, item) => {

            let amount = Number(item.totalAmount);

            if (item.frequency === "Daily") amount *= 30;
            if (item.frequency === "Weekly") amount *= 4.33;
            if (item.frequency === "Yearly") amount /= 12;

            return sum + amount;
        }, 0);

    document.getElementById("totalSubscriptions").textContent = total;
    document.getElementById("activeSubscriptions").textContent = active;
    document.getElementById("pendingSubscriptions").textContent = pending;

    document.getElementById("monthlySubscriptionValue").textContent =
        formatPrice(monthlyValue);
}


/* ---------- SUBSCRIPTION FORM ---------- */

function openSubscriptionModal(subscriptionIndex = null) {

    if (document.getElementById("subscriptionModal")) return;

    if (!customers.length) {
        alert("Please add a customer before creating a subscription.");
        return;
    }

    if (!products.length) {
        alert("Please add a product before creating a subscription.");
        return;
    }

    const isEditing = subscriptionIndex !== null;

    const subscription = isEditing
        ? subscriptions[subscriptionIndex]
        : null;

    if (isEditing && !subscription) return;

    const modal = document.createElement("div");

    modal.id = "subscriptionModal";
    modal.className = "customer-modal-overlay";

    const customerOptions = customers.map(customer => `
        <option value="${escapeHTML(customer.email)}">
            ${escapeHTML(customer.name)}
        </option>
    `).join("");

    const productOptions = products.map((product, index) => `
        <option value="${index}">
            ${escapeHTML(product.name)}
        </option>
    `).join("");

    modal.innerHTML = `

        <div class="customer-modal">

            <div class="modal-header">
                <div>
                    <h2>
                        ${isEditing ? "Edit Subscription" : "Create Subscription"}
                    </h2>
                    <p>Configure the customer's subscription details.</p>
                </div>

                <button type="button" class="modal-close"
                    id="closeSubscriptionModal">&times;</button>
            </div>

            <form id="subscriptionForm">

                <div class="form-group">
                    <label>Customer</label>
                    <select id="subscriptionCustomer" required>
                        <option value="">Select customer</option>
                        ${customerOptions}
                    </select>
                </div>

                <div class="form-group">
                    <label>Product / Plan</label>
                    <select id="subscriptionProduct" required>
                        <option value="">Select product</option>
                        ${productOptions}
                    </select>
                </div>

                <div class="form-group">
                    <label>Product Variant</label>
                    <select id="subscriptionVariant">
                        <option value="">Default product</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Quantity</label>
                    <input type="number" id="subscriptionQuantity"
                        min="1" value="1" required>
                </div>

                <div class="form-group">
                    <label>Billing Frequency</label>
                    <select id="subscriptionFrequency" required>
                        <option value="Daily">Daily</option>
                        <option value="Weekly">Weekly</option>
                        <option value="Monthly" selected>Monthly</option>
                        <option value="Yearly">Yearly</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Start Date</label>
                    <input type="date" id="subscriptionStart" required>
                </div>

                <div class="form-group">
                    <label>End Date (Optional)</label>
                    <input type="date" id="subscriptionEnd">
                </div>

                <div class="form-group">
                    <label>Subscription Status</label>
                    <select id="subscriptionStatus">
                        <option value="Draft">Draft</option>
                        <option value="Quotation">Quotation</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Active">Active</option>
                        <option value="Closed">Closed</option>
                    </select>
                </div>

                <div id="paymentInvoiceSummary" class="payment-invoice-summary"></div>

                <div class="form-group">
                    <label>Outstanding Balance</label>
                    <input type="text" id="paymentBalance"
                        readonly value="₹0.00">
                </div>

                <p class="variant-help">
                    The total is calculated from the product price,
                    selected variant and quantity.
                </p>

                <div class="modal-actions">
                    <button type="button" id="cancelSubscription">
                        Cancel
                    </button>

                    <button type="submit">
                        ${isEditing ? "Update Subscription" : "Save Subscription"}
                    </button>
                </div>

            </form>
        </div>
    `;

    document.body.appendChild(modal);

    const customerSelect = document.getElementById("subscriptionCustomer");
    const productSelect = document.getElementById("subscriptionProduct");
    const variantSelect = document.getElementById("subscriptionVariant");

    if (isEditing) {
        customerSelect.value = subscription.customerEmail;
        productSelect.value = String(subscription.productIndex);
    }

    function updateVariantOptions(selectedVariant = "") {

        const product = products[Number(productSelect.value)];

        variantSelect.innerHTML =
            `<option value="">Default product</option>`;

        if (product) {
            (product.variants || []).forEach(variant => {

                const option = document.createElement("option");
                option.value = variant.name;
                option.textContent =
                    `${variant.name} (+${formatPrice(variant.priceAddon)})`;

                variantSelect.appendChild(option);
            });
        }

        variantSelect.value = selectedVariant;
        updateSubscriptionAmount();
    }

    function updateSubscriptionAmount() {

        const product = products[Number(productSelect.value)];

        if (!product) {
            document.getElementById("subscriptionAmountPreview").value =
                formatPrice(0);
            return;
        }

        const variant = (product.variants || []).find(
            item => item.name === variantSelect.value
        );

        const basePrice = Number(product.salesPrice);
        const addon = variant ? Number(variant.priceAddon) : 0;

        const quantity = Math.max(
            1,
            Number(document.getElementById("subscriptionQuantity").value) || 1
        );

        document.getElementById("subscriptionAmountPreview").value =
            formatPrice((basePrice + addon) * quantity);
    }

    productSelect.addEventListener("change", () => {
        updateVariantOptions();
    });

    variantSelect.addEventListener("change", updateSubscriptionAmount);

    document.getElementById("subscriptionQuantity")
        .addEventListener("input", updateSubscriptionAmount);

    if (isEditing) {

        document.getElementById("subscriptionQuantity").value =
            subscription.quantity;

        document.getElementById("subscriptionFrequency").value =
            subscription.frequency;

        document.getElementById("subscriptionStart").value =
            subscription.startDate;

        document.getElementById("subscriptionEnd").value =
            subscription.endDate || "";

        document.getElementById("subscriptionStatus").value =
            subscription.status;

        updateVariantOptions(subscription.variantName || "");

    } else {

        document.getElementById("subscriptionStart").value =
            getLocalToday();

        updateVariantOptions();
    }

    document.getElementById("closeSubscriptionModal")
        .addEventListener("click", closeSubscriptionModal);

    document.getElementById("cancelSubscription")
        .addEventListener("click", closeSubscriptionModal);

    document.getElementById("subscriptionForm")
        .addEventListener("submit", event => {
            saveSubscription(event, subscriptionIndex);
        });

    modal.addEventListener("click", event => {
        if (event.target === modal) closeSubscriptionModal();
    });
}


function saveSubscription(event, subscriptionIndex = null) {

    event.preventDefault();

    const customerEmail =
        document.getElementById("subscriptionCustomer").value;

    const productIndex = Number(
        document.getElementById("subscriptionProduct").value
    );

    const variantName =
        document.getElementById("subscriptionVariant").value;

    const quantity = Number(
        document.getElementById("subscriptionQuantity").value
    );

    const frequency =
        document.getElementById("subscriptionFrequency").value;

    const startDate =
        document.getElementById("subscriptionStart").value;

    const endDate =
        document.getElementById("subscriptionEnd").value;

    const status =
        document.getElementById("subscriptionStatus").value;

    const customer = customers.find(
        item => item.email === customerEmail
    );

    const product = products[productIndex];

    if (!customer || !product) {
        alert("Please select a valid customer and product.");
        return;
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
        alert("Quantity must be at least 1.");
        return;
    }

    if (!startDate) {
        alert("Please select a start date.");
        return;
    }

    if (endDate && endDate < startDate) {
        alert("End date cannot be before the start date.");
        return;
    }

    const variant = (product.variants || []).find(
        item => item.name === variantName
    );

    const unitPrice =
        Number(product.salesPrice) +
        (variant ? Number(variant.priceAddon) : 0);

    const totalAmount = unitPrice * quantity;

    const existing = subscriptionIndex !== null
        ? subscriptions[subscriptionIndex]
        : null;

    const subscriptionData = {

        id: existing
            ? existing.id
            : "SUB-" + Date.now().toString().slice(-8),

        customerName: customer.name,
        customerEmail: customer.email,

        productName: product.name,
        productIndex,

        variantName,
        quantity,
        frequency,

        unitPrice,
        totalAmount,

        startDate,
        endDate,

        nextBilling: existing
            ? existing.nextBilling
            : calculateNextBilling(startDate, frequency),

        status,

        createdAt: existing
            ? existing.createdAt
            : new Date().toISOString()
    };

    if (subscriptionIndex !== null) {
        subscriptions[subscriptionIndex] = subscriptionData;
    } else {
        subscriptions.push(subscriptionData);
    }

    saveSubscriptionsToStorage();
    closeSubscriptionModal();
    searchSubscriptions();

    alert(subscriptionIndex !== null
        ? "Subscription updated successfully!"
        : "Subscription created successfully!");
}


function closeSubscriptionModal() {
    document.getElementById("subscriptionModal")?.remove();
}


function deleteSubscription(index) {

    const subscription = subscriptions[index];
    if (!subscription) return;

    const hasInvoices = invoices.some(
        invoice => invoice.subscriptionId === subscription.id
    );

    if (hasInvoices) {
        alert("This subscription has invoices linked to it. Keep the subscription record.");
        return;
    }

    if (!confirm(`Delete subscription ${subscription.id}?`)) return;

    subscriptions.splice(index, 1);

    saveSubscriptionsToStorage();
    searchSubscriptions();
}


function searchSubscriptions() {

    const input = document.getElementById("subscriptionSearch");
    if (!input) return;

    const value = input.value.toLowerCase().trim();

    const filtered = subscriptions.filter(subscription =>
        subscription.id.toLowerCase().includes(value) ||
        subscription.customerName.toLowerCase().includes(value) ||
        subscription.productName.toLowerCase().includes(value) ||
        subscription.status.toLowerCase().includes(value)
    );

    renderSubscriptions(filtered);
}
/* =====================================================
   8. INVOICES MODULE
===================================================== */

function showInvoicesPage() {

    mainContent.innerHTML = `

        <header class="topbar">
            <div class="search-box">
                <span>⌕</span>
                <input type="text" id="invoiceSearch"
                    placeholder="Search invoices...">
            </div>
        </header>

        <section class="welcome-section">
            <div>
                <p class="eyebrow">WORKSPACE</p>
                <h1>Invoices</h1>
                <p class="subtitle">
                    Create invoices and track customer payments.
                </p>
            </div>

            <button class="date-button" id="refreshInvoicesBtn">
                ↻ Refresh
            </button>
        </section>

        <section class="stats-grid">

            <div class="stat-card purple">
                <p>Total Invoices</p>
                <h2 id="totalInvoices">0</h2>
                <span>All generated invoices</span>
            </div>

            <div class="stat-card orange">
                <p>Draft</p>
                <h2 id="draftInvoices">0</h2>
                <span>Awaiting confirmation</span>
            </div>

            <div class="stat-card green">
                <p>Paid</p>
                <h2 id="paidInvoices">0</h2>
                <span>Successfully paid</span>
            </div>

            <div class="stat-card pink">
                <p>Outstanding</p>
                <h2 id="outstandingInvoices">₹0</h2>
                <span>Remaining unpaid value</span>
            </div>

        </section>

        <section class="content-card">

            <h3>All Invoices</h3>

            <p class="subtitle">
                Confirm invoices and record full or partial payments.
            </p>

            <table>
                <thead>
                    <tr>
                        <th>Invoice ID</th>
                        <th>Customer</th>
                        <th>Subscription</th>
                        <th>Issue Date</th>
                        <th>Due Date</th>
                        <th>Amount</th>
                        <th>Paid</th>
                        <th>Balance</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>

                <tbody id="invoiceTableBody"></tbody>
            </table>

        </section>

        <footer>© 2026 Brightloop Software</footer>
    `;

    renderInvoices();

    document.getElementById("invoiceSearch")
        .addEventListener("input", searchInvoices);

    document.getElementById("refreshInvoicesBtn")
        .addEventListener("click", () => renderInvoices());

    document.getElementById("invoiceTableBody")
        .addEventListener("click", event => {

            const button = event.target.closest("button");
            if (!button) return;

            const index = Number(button.dataset.index);

            if (button.classList.contains("confirm-invoice-btn")) {
                updateInvoiceStatus(index, "Confirmed");
            }

            if (button.classList.contains("pay-invoice-btn")) {
                openPaymentModal(index);
            }

            if (button.classList.contains("delete-invoice-btn")) {
                deleteInvoice(index);
            }
        });
}


function renderInvoices(invoiceList = invoices) {

    const tableBody = document.getElementById("invoiceTableBody");
    if (!tableBody) return;

    tableBody.innerHTML = "";

    if (!invoiceList.length) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="10">
                    No invoices found. Generate an invoice from a subscription.
                </td>
            </tr>
        `;

        updateInvoiceStats();
        return;
    }

    invoiceList.forEach(invoice => {

        const index = invoices.indexOf(invoice);

        const paid = Number(invoice.amountPaid || 0);
        const balance = Math.max(0, Number(invoice.amount) - paid);

        const statusClass = invoice.status.toLowerCase()
            .replace(/\s+/g, "-");

        let actionButtons = "";

        if (invoice.status === "Draft") {
            actionButtons = `
                <button class="customer-action-btn confirm-invoice-btn"
                    data-index="${index}">Confirm</button>
            `;
        }

        if (
            invoice.status === "Confirmed" ||
            invoice.status === "Partially Paid"
        ) {
            actionButtons = `
                <button class="customer-action-btn pay-invoice-btn"
                    data-index="${index}">
                    Record Payment
                </button>
            `;
        }

        if (invoice.status === "Paid") {
            actionButtons = `
                <span class="variant-count">Completed</span>
            `;
        }

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHTML(invoice.id)}</td>

            <td>
                ${escapeHTML(invoice.customerName)}
                <small class="variant-preview">
                    ${escapeHTML(invoice.customerEmail)}
                </small>
            </td>

            <td>
                ${escapeHTML(invoice.subscriptionId)}
                <small class="variant-preview">
                    ${escapeHTML(invoice.productName)}
                </small>
            </td>

            <td>${formatDate(invoice.issueDate)}</td>
            <td>${formatDate(invoice.dueDate)}</td>
            <td>
            <div class="invoice-amount-details">
                <span class="invoice-subtotal">
                    ${formatPrice(invoice.subtotal ?? invoice.amount)}
                </span>

                ${
                    Number(invoice.discountAmount || 0) > 0
                        ? `
                            <small class="invoice-discount">
                                ${escapeHTML(invoice.discountName || "Discount")}
                                (-${formatPrice(invoice.discountAmount)})
                            </small>
                        `
                        : ""
                }

                <strong class="invoice-final-amount">
                    ${formatPrice(invoice.amount)}
                </strong>
            </div>
        </td>
            <td>${formatPrice(paid)}</td>
            <td>${formatPrice(balance)}</td>

            <td>
                <span class="status ${statusClass}">
                    ${escapeHTML(invoice.status)}
                </span>
            </td>

            <td>
                <div class="invoice-actions">
                    ${actionButtons}

                    <button class="customer-action-btn delete-invoice-btn"
                        data-index="${index}">Delete</button>
                </div>
            </td>
        `;

        tableBody.appendChild(row);
    });

    updateInvoiceStats();
}


function updateInvoiceStats() {

    const total = invoices.length;

    const draft = invoices.filter(
        invoice => invoice.status === "Draft"
    ).length;

    const paid = invoices.filter(
        invoice => invoice.status === "Paid"
    ).length;

    const outstanding = invoices
        .filter(invoice =>
            ["Confirmed", "Partially Paid"].includes(invoice.status)
        )
        .reduce((sum, invoice) => {

            const remaining =
                Number(invoice.amount) - Number(invoice.amountPaid || 0);

            return sum + Math.max(0, remaining);
        }, 0);

    document.getElementById("totalInvoices").textContent = total;
    document.getElementById("draftInvoices").textContent = draft;
    document.getElementById("paidInvoices").textContent = paid;

    document.getElementById("outstandingInvoices").textContent =
        formatPrice(outstanding);
}


/* ---------- GENERATE INVOICE ---------- */

function generateInvoice(subscriptionIndex) {

    const subscription = subscriptions[subscriptionIndex];

    if (!subscription) {
        alert("Subscription not found.");
        return;
    }

    if (!["Confirmed", "Active"].includes(subscription.status)) {
        alert("Only Confirmed or Active subscriptions can generate invoices.");
        return;
    }

    const billingDate = subscription.nextBilling || getLocalToday();

    const duplicate = invoices.some(invoice =>
        invoice.subscriptionId === subscription.id &&
        invoice.billingDate === billingDate
    );

    if (duplicate) {
        alert("An invoice has already been generated for this billing date.");
        return;
    }

    const customer = customers.find(
        item => item.email === subscription.customerEmail
    );

    if (!customer) {
        alert("The customer linked to this subscription could not be found.");
        return;
    }
    // Calculate applicable discount
    const appliedDiscount = calculateApplicableDiscount(
        subscription,
        billingDate
    );

    const subtotal = Number(subscription.totalAmount);

    const discountAmount = appliedDiscount
        ? appliedDiscount.discountAmount
        : 0;

    const finalAmount = subtotal - discountAmount;
    const invoice = {

        id: "INV-" + Date.now().toString().slice(-8),

        subscriptionId: subscription.id,

        customerName: subscription.customerName,
        customerEmail: subscription.customerEmail,

        productName: subscription.productName,
        variantName: subscription.variantName || "",

        quantity: subscription.quantity,

        billingDate,

        issueDate: getLocalToday(),

        dueDate: addDaysToDate(getLocalToday(), 7),

        subtotal: subtotal,

        discountId: appliedDiscount
            ? appliedDiscount.discount.id
            : null,

        discountName: appliedDiscount
            ? appliedDiscount.discount.name
            : null,

        discountAmount: discountAmount,

        amount: finalAmount,

        amountPaid: 0,

        status: "Draft",

        createdAt: new Date().toISOString()
    };

    invoices.push(invoice);

    // Update discount usage count
    if (appliedDiscount) {
        appliedDiscount.discount.usedCount =
            Number(appliedDiscount.discount.usedCount || 0) + 1;

        saveDiscountsToStorage();
    }

    saveInvoicesToStorage();

    subscription.nextBilling = calculateNextBilling(
        billingDate,
        subscription.frequency
    );

    saveSubscriptionsToStorage();

    alert(`Invoice ${invoice.id} generated successfully!`);

    activateSidebarPage("Invoices");
    showInvoicesPage();
}


/* ---------- UPDATE INVOICE STATUS ---------- */

function updateInvoiceStatus(index, newStatus) {

    const invoice = invoices[index];
    if (!invoice) return;

    if (newStatus !== "Confirmed" || invoice.status !== "Draft") {
        return;
    }

    if (!confirm(`Confirm invoice ${invoice.id}?`)) return;

    invoice.status = "Confirmed";
    invoice.confirmedAt = new Date().toISOString();

    saveInvoicesToStorage();
    renderInvoices();
}


/* ---------- DELETE INVOICE ---------- */

function deleteInvoice(index) {

    const invoice = invoices[index];
    if (!invoice) return;

    const hasPayments = payments.some(
        payment => payment.invoiceId === invoice.id
    );

    if (hasPayments) {
        alert("This invoice has payment records. Delete its payments first.");
        return;
    }

    if (invoice.status === "Paid") {
        alert("Paid invoices cannot be deleted.");
        return;
    }

    if (!confirm(`Delete invoice ${invoice.id}?`)) return;

    invoices.splice(index, 1);

    saveInvoicesToStorage();
    renderInvoices();
}


/* ---------- SEARCH INVOICES ---------- */

function searchInvoices() {

    const input = document.getElementById("invoiceSearch");
    if (!input) return;

    const value = input.value.toLowerCase().trim();

    const filtered = invoices.filter(invoice =>

        invoice.id.toLowerCase().includes(value) ||
        invoice.customerName.toLowerCase().includes(value) ||
        invoice.customerEmail.toLowerCase().includes(value) ||
        invoice.subscriptionId.toLowerCase().includes(value) ||
        invoice.productName.toLowerCase().includes(value) ||
        invoice.status.toLowerCase().includes(value)
    );

    renderInvoices(filtered);
}


/* =====================================================
   9. PAYMENTS MODULE
===================================================== */

function showPaymentsPage() {

    mainContent.innerHTML = `

        <header class="topbar">
            <div class="search-box">
                <span>⌕</span>
                <input type="text" id="paymentSearch"
                    placeholder="Search payments...">
            </div>
        </header>

        <section class="welcome-section">

            <div>
                <p class="eyebrow">WORKSPACE</p>
                <h1>Payments</h1>
                <p class="subtitle">
                    Record and manage customer payments.
                </p>
            </div>

            <button class="date-button" id="addPaymentBtn">
                + Record Payment
            </button>

        </section>

        <section class="stats-grid">

            <div class="stat-card purple">
                <p>Total Payments</p>
                <h2 id="totalPayments">0</h2>
                <span>Recorded transactions</span>
            </div>

            <div class="stat-card green">
                <p>Total Collected</p>
                <h2 id="totalCollected">₹0</h2>
                <span>Money received</span>
            </div>

            <div class="stat-card orange">
                <p>Outstanding</p>
                <h2 id="paymentOutstanding">₹0</h2>
                <span>Remaining invoice balances</span>
            </div>

            <div class="stat-card pink">
                <p>Partial Payments</p>
                <h2 id="partialPayments">0</h2>
                <span>Invoices partly paid</span>
            </div>

        </section>

        <section class="content-card">

            <h3>Payment History</h3>

            <p class="subtitle">
                View all recorded payment transactions.
            </p>

            <table>
                <thead>
                    <tr>
                        <th>Payment ID</th>
                        <th>Invoice ID</th>
                        <th>Customer</th>
                        <th>Payment Date</th>
                        <th>Method</th>
                        <th>Amount</th>
                        <th>Note</th>
                        <th>Actions</th>
                    </tr>
                </thead>

                <tbody id="paymentTableBody"></tbody>
            </table>

        </section>

        <footer>© 2026 Brightloop Software</footer>
    `;

    renderPayments();

    document.getElementById("paymentSearch")
        .addEventListener("input", searchPayments);

    document.getElementById("addPaymentBtn")
        .addEventListener("click", () => openPaymentModal());

    document.getElementById("paymentTableBody")
        .addEventListener("click", event => {

            const button = event.target.closest("button");
            if (!button) return;

            const index = Number(button.dataset.index);

            if (button.classList.contains("delete-payment-btn")) {
                deletePayment(index);
            }
        });
}


/* ---------- PAYMENT TABLE ---------- */

function renderPayments(paymentList = payments) {

    const tableBody = document.getElementById("paymentTableBody");
    if (!tableBody) return;

    tableBody.innerHTML = "";

    if (!paymentList.length) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="8">
                    No payments recorded yet. Record your first payment!
                </td>
            </tr>
        `;

        updatePaymentStats();
        return;
    }

    paymentList.forEach(payment => {

        const index = payments.indexOf(payment);

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHTML(payment.id)}</td>
            <td>${escapeHTML(payment.invoiceId)}</td>
            <td>${escapeHTML(payment.customerName)}</td>
            <td>${formatDate(payment.paymentDate)}</td>
            <td>${escapeHTML(payment.method)}</td>
            <td>${formatPrice(payment.amount)}</td>
            <td>${escapeHTML(payment.note || "—")}</td>
            <td>
                <button class="customer-action-btn delete-payment-btn"
                    data-index="${index}">Delete</button>
            </td>
        `;

        tableBody.appendChild(row);
    });

    updatePaymentStats();
}


/* ---------- PAYMENT STATISTICS ---------- */

function updatePaymentStats() {

    const totalPayments = payments.length;

    const totalCollected = payments.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0
    );

    const outstanding = invoices
        .filter(invoice =>
            ["Confirmed", "Partially Paid"].includes(invoice.status)
        )
        .reduce((sum, invoice) => {

            const balance =
                Number(invoice.amount) - Number(invoice.amountPaid || 0);

            return sum + Math.max(0, balance);
        }, 0);

    const partialCount = invoices.filter(
        invoice => invoice.status === "Partially Paid"
    ).length;

    document.getElementById("totalPayments").textContent =
        totalPayments;

    document.getElementById("totalCollected").textContent =
        formatPrice(totalCollected);

    document.getElementById("paymentOutstanding").textContent =
        formatPrice(outstanding);

    document.getElementById("partialPayments").textContent =
        partialCount;
}


/* ---------- OPEN PAYMENT FORM ---------- */

function openPaymentModal(invoiceIndex = null) {

    if (document.getElementById("paymentModal")) return;

    const eligibleInvoices = invoices.filter(invoice =>
        ["Confirmed", "Partially Paid"].includes(invoice.status) &&
        Number(invoice.amount) > Number(invoice.amountPaid || 0)
    );

    if (!eligibleInvoices.length) {
        alert("There are no confirmed invoices with outstanding balances.");
        return;
    }

    const selectedInvoice = invoiceIndex !== null
        ? invoices[invoiceIndex]
        : null;

    if (
        invoiceIndex !== null &&
        (!selectedInvoice ||
        !["Confirmed", "Partially Paid"].includes(selectedInvoice.status))
    ) {
        alert("This invoice is not available for payment.");
        return;
    }

    const modal = document.createElement("div");

    modal.id = "paymentModal";
    modal.className = "customer-modal-overlay";

    const invoiceOptions = eligibleInvoices.map(invoice => {

        const balance =
            Number(invoice.amount) - Number(invoice.amountPaid || 0);

        return `
            <option value="${escapeHTML(invoice.id)}">
                ${escapeHTML(invoice.id)} — ${escapeHTML(invoice.customerName)}
                (Balance: ${formatPrice(balance)})
            </option>
        `;
    }).join("");

    modal.innerHTML = `

        <div class="customer-modal">

            <div class="modal-header">
                <div>
                    <h2>Record Payment</h2>
                    <p>Enter the payment details below.</p>
                </div>

                <button type="button" class="modal-close"
                    id="closePaymentModal">&times;</button>
            </div>

            <form id="paymentForm">
                <div id="paymentInvoiceSummary" class="payment-invoice-summary"></div>

                <div class="form-group">
                    <label>Select Invoice</label>

                    <select id="paymentInvoice" required>
                        <option value="">Choose an invoice</option>
                        ${invoiceOptions}
                    </select>
                </div>

                <div class="form-group">
                    <label>Outstanding Balance</label>
                    <input type="text" id="paymentBalance"
                        readonly value="₹0.00">
                </div>

                <div class="form-group">
                    <label>Payment Amount (₹)</label>
                    <input type="number" id="paymentAmount"
                        min="0.01" step="0.01" required
                        placeholder="Enter amount">
                </div>

                <div class="form-group">
                    <label>Payment Method</label>

                    <select id="paymentMethod" required>
                        <option value="">Select method</option>
                        <option value="UPI">UPI</option>
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Payment Date</label>
                    <input type="date" id="paymentDate"
                        value="${getLocalToday()}" required>
                </div>

                <div class="form-group">
                    <label>Note (Optional)</label>
                    <textarea id="paymentNote" rows="3"
                        placeholder="Transaction reference or additional note"></textarea>
                </div>

                <div class="modal-actions">
                    <button type="button" id="cancelPayment">
                        Cancel
                    </button>

                    <button type="submit">
                        Save Payment
                    </button>
                </div>

            </form>

        </div>
    `;

    document.body.appendChild(modal);

    const invoiceSelect = document.getElementById("paymentInvoice");
    const amountInput = document.getElementById("paymentAmount");

    if (selectedInvoice) {
        invoiceSelect.value = selectedInvoice.id;
    }

    function updatePaymentBalance() {

        const invoice = invoices.find(
            item => String(item.id) === String(invoiceSelect.value)
        );

        if (!invoice) {
            document.getElementById("paymentBalance").value =
                formatPrice(0);

            document.getElementById("paymentInvoiceSummary").innerHTML = "";

            amountInput.removeAttribute("max");
            return;
        }

        const balance = Math.max(
            0,
            Number(invoice.amount) - Number(invoice.amountPaid || 0)
        );
        const subtotal = Number(invoice.subtotal ?? invoice.amount);
        const discountAmount = Number(invoice.discountAmount || 0);

        document.getElementById("paymentInvoiceSummary").innerHTML = `
            <h3>Invoice Summary</h3>

            <div class="payment-summary-row">
                <span>Original Amount</span>
                <span>${formatPrice(subtotal)}</span>
            </div>

            ${
                discountAmount > 0
                    ? `
                        <div class="payment-summary-row discount">
                            <span>${escapeHTML(invoice.discountName || "Discount")}</span>
                            <span>-${formatPrice(discountAmount)}</span>
                        </div>
                    `
                    : ""
            }

            <div class="payment-summary-row final">
                <strong>Final Invoice Amount</strong>
                <strong>${formatPrice(invoice.amount)}</strong>
            </div>
        `;

        document.getElementById("paymentBalance").value =
            formatPrice(balance);

        amountInput.max = balance.toFixed(2);
        amountInput.placeholder = `Maximum ${balance.toFixed(2)}`;
    }

    invoiceSelect.addEventListener("change", updatePaymentBalance);

    document.getElementById("closePaymentModal")
        .addEventListener("click", closePaymentModal);

    document.getElementById("cancelPayment")
        .addEventListener("click", closePaymentModal);

    document.getElementById("paymentForm")
        .addEventListener("submit", savePayment);

    modal.addEventListener("click", event => {
        if (event.target === modal) closePaymentModal();
    });

    // Update the balance only after registering all event listeners
    updatePaymentBalance();
}


function closePaymentModal() {
    document.getElementById("paymentModal")?.remove();
}


/* ---------- SAVE PAYMENT ---------- */

function savePayment(event) {

    event.preventDefault();

    const invoiceId =
        document.getElementById("paymentInvoice").value;

    const amount =
        Number(document.getElementById("paymentAmount").value);

    const method =
        document.getElementById("paymentMethod").value;

    const paymentDate =
        document.getElementById("paymentDate").value;

    const note =
        document.getElementById("paymentNote").value.trim();

    const invoice = invoices.find(
        item => item.id === invoiceId
    );

    if (!invoice) {
        alert("Please select a valid invoice.");
        return;
    }

    if (!["Confirmed", "Partially Paid"].includes(invoice.status)) {
        alert("Only confirmed invoices can receive payments.");
        return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Enter a valid payment amount greater than zero.");
        return;
    }

    if (!method || !paymentDate) {
        alert("Please select a payment method and date.");
        return;
    }

    const currentPaid = Number(invoice.amountPaid || 0);
    const balance = Number(invoice.amount) - currentPaid;

    if (amount > balance + 0.001) {
        alert(`Payment cannot exceed the outstanding balance of ${formatPrice(balance)}.`);
        return;
    }

    const payment = {

        id: "PAY-" + Date.now().toString().slice(-8),

        invoiceId: invoice.id,

        customerName: invoice.customerName,
        customerEmail: invoice.customerEmail,

        amount,

        method,
        paymentDate,
        note,

        createdAt: new Date().toISOString()
    };

    payments.push(payment);

    invoice.amountPaid = currentPaid + amount;

    if (invoice.amountPaid >= Number(invoice.amount) - 0.001) {

        invoice.amountPaid = Number(invoice.amount);
        invoice.status = "Paid";
        invoice.paidAt = new Date().toISOString();

    } else {

        invoice.status = "Partially Paid";
    }

    savePaymentsToStorage();
    saveInvoicesToStorage();

    closePaymentModal();

    alert(
        invoice.status === "Paid"
            ? `Payment recorded! Invoice ${invoice.id} is now fully paid.`
            : `Payment recorded! Remaining balance: ${formatPrice(
                Number(invoice.amount) - invoice.amountPaid
            )}`
    );

    activateSidebarPage("Payments");
    showPaymentsPage();
}


/* ---------- DELETE PAYMENT ---------- */

function deletePayment(index) {

    const payment = payments[index];
    if (!payment) return;

    if (!confirm(`Delete payment ${payment.id}? This will restore the invoice balance.`)) {
        return;
    }

    const invoice = invoices.find(
        item => item.id === payment.invoiceId
    );

    if (invoice) {

        invoice.amountPaid = Math.max(
            0,
            Number(invoice.amountPaid || 0) - Number(payment.amount)
        );

        if (invoice.amountPaid <= 0.001) {

            invoice.amountPaid = 0;
            invoice.status = "Confirmed";
            delete invoice.paidAt;

        } else {

            invoice.status = "Partially Paid";
            delete invoice.paidAt;
        }

        saveInvoicesToStorage();
    }

    payments.splice(index, 1);

    savePaymentsToStorage();

    renderPayments();
}


/* ---------- SEARCH PAYMENTS ---------- */

function searchPayments() {

    const input = document.getElementById("paymentSearch");
    if (!input) return;

    const value = input.value.toLowerCase().trim();

    const filtered = payments.filter(payment =>

        payment.id.toLowerCase().includes(value) ||
        payment.invoiceId.toLowerCase().includes(value) ||
        payment.customerName.toLowerCase().includes(value) ||
        payment.method.toLowerCase().includes(value) ||
        (payment.note || "").toLowerCase().includes(value)
    );

    renderPayments(filtered);
}


/* =====================================================
   10. DATE HELPERS
===================================================== */

function getLocalToday() {

    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function calculateNextBilling(startDate, frequency) {

    const date = new Date(startDate + "T12:00:00");

    if (frequency === "Daily") {
        date.setDate(date.getDate() + 1);
    }

    if (frequency === "Weekly") {
        date.setDate(date.getDate() + 7);
    }

    if (frequency === "Monthly") {
        date.setMonth(date.getMonth() + 1);
    }

    if (frequency === "Yearly") {
        date.setFullYear(date.getFullYear() + 1);
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function addDaysToDate(dateValue, days) {

    const date = new Date(dateValue + "T12:00:00");

    date.setDate(date.getDate() + days);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function formatDate(dateValue) {

    if (!dateValue) return "—";

    const date = new Date(dateValue + "T00:00:00");

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


/* =====================================================
   11. SHARED HELPER FUNCTIONS
===================================================== */

function formatPrice(price) {

    return "₹" + Number(price).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


function escapeHTML(value) {

    return String(value ?? "").replace(/[&<>"']/g, character => {

        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}

function showDiscountsPage() {
    const content = mainContent;

    content.innerHTML = `
        <div class="page-header">
            <div>
                <h1>Discounts</h1>
                <p>Manage discounts and promotional offers.</p>
            </div>
            <button class="primary-btn" onclick="openDiscountModal()">
                + Create Discount
            </button>
        </div>

        <div class="content-card">
            <div class="card-header">
                <h2>All Discounts</h2>
                <input
                    type="text"
                    id="discountSearch"
                    placeholder="Search discounts..."
                    oninput="renderDiscountsTable()"
                >
            </div>

            <div id="discountsTableContainer"></div>
        </div>
    `;

    renderDiscountsTable();
}

function renderDiscountsTable() {
    const container = document.getElementById("discountsTableContainer");

    if (!container) return;

    const searchInput = document.getElementById("discountSearch");
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";

    const filteredDiscounts = discounts.filter(discount =>
        discount.name.toLowerCase().includes(searchTerm)
    );

    if (filteredDiscounts.length === 0) {
        container.innerHTML = `
            <p class="empty-state">No discounts found. Create your first discount!</p>
        `;
        return;
    }

    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Discount Name</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Usage</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${filteredDiscounts.map(discount => `
                    <tr>
                        <td>${discount.name}</td>
                        <td>${discount.type}</td>
                        <td>${discount.type === "Percentage"
                            ? discount.value + "%"
                            : "₹" + discount.value}</td>
                        <td>${discount.usedCount || 0} / ${discount.usageLimit || "Unlimited"}</td>
                        <td>
                            <button class="discount-action-btn edit-btn"
                                onclick="editDiscount('${discount.id}')">
                                Edit
                            </button>

                            <button class="discount-action-btn delete-btn"
                                onclick="deleteDiscount('${discount.id}')">
                                Delete
                            </button>
                        </td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
}

function openDiscountModal(discountId = null) {
    const discount = discountId
        ? discounts.find(d => d.id === discountId)
        : null;

    const content = document.body;

    const modal = document.createElement("div");
    modal.className = "customer-modal-overlay";
    modal.id = "discountModal";

    modal.innerHTML = `
        <div class="customer-modal">
            <div class="modal-header">
                <h2>${discount ? "Edit Discount" : "Create Discount"}</h2>
                <button type="button" class="modal-close" onclick="closeDiscountModal()">×</button>
            </div>

            <form id="discountForm">
                <div class="form-group">
                    <label>Discount Name</label>
                    <input
                        type="text"
                        id="discountName"
                        value="${discount ? discount.name : ""}"
                        placeholder="e.g. Summer Sale"
                        required
                    >
                </div>

                <div class="form-group">
                    <label>Discount Type</label>
                    <select id="discountType">
                        <option value="Percentage" ${discount?.type === "Percentage" ? "selected" : ""}>Percentage (%)</option>
                        <option value="Fixed" ${discount?.type === "Fixed" ? "selected" : ""}>Fixed Amount (₹)</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Discount Value</label>
                    <input
                        type="number"
                        id="discountValue"
                        min="0.01"
                        step="0.01"
                        value="${discount ? discount.value : ""}"
                        required
                    >
                </div>

                <div class="form-group">
                    <label>Minimum Purchase Amount (₹)</label>
                    <input
                        type="number"
                        id="discountMinimum"
                        min="0"
                        value="${discount ? discount.minimumPurchase || 0 : 0}"
                    >
                </div>

                <div class="form-group">
                    <label>Minimum Quantity</label>
                    <input
                        type="number"
                        id="discountQuantity"
                        min="1"
                        value="${discount ? discount.minimumQuantity || 1 : 1}"
                    >
                </div>

                <div class="form-group">
                    <label>Start Date</label>
                    <input
                        type="date"
                        id="discountStartDate"
                        value="${discount ? discount.startDate || "" : ""}"
                        required
                    >
                </div>

                <div class="form-group">
                    <label>Expiry Date</label>
                    <input
                        type="date"
                        id="discountEndDate"
                        value="${discount ? discount.endDate || "" : ""}"
                        required
                    >
                </div>

                <div class="form-group">
                    <label>Usage Limit</label>
                    <input
                        type="number"
                        id="discountUsageLimit"
                        min="1"
                        value="${discount ? discount.usageLimit || "" : ""}"
                        placeholder="Leave empty for unlimited"
                    >
                </div>

                <div class="modal-actions">
                    <button type="button" onclick="closeDiscountModal()">Cancel</button>
                    <button type="submit" class="primary-btn">
                        Save Discount
                    </button>
                </div>
            </form>
        </div>
    `;

    content.appendChild(modal);

    document.getElementById("discountForm").addEventListener("submit", function(event) {
        event.preventDefault();
        saveDiscount(discountId);
    });
}

function closeDiscountModal() {
    const modal = document.getElementById("discountModal");
    if (modal) modal.remove();
}

function editDiscount(discountId) {
    openDiscountModal(discountId);
}

function saveDiscount(discountId = null) {
    const name = document.getElementById("discountName").value.trim();
    const type = document.getElementById("discountType").value;
    const value = Number(document.getElementById("discountValue").value);
    const minimumPurchase = Number(document.getElementById("discountMinimum").value) || 0;
    const minimumQuantity = Number(document.getElementById("discountQuantity").value) || 1;
    const startDate = document.getElementById("discountStartDate").value;
    const endDate = document.getElementById("discountEndDate").value;
    const usageLimitInput = document.getElementById("discountUsageLimit").value;
    const usageLimit = usageLimitInput === "" ? null : Number(usageLimitInput);

    if (!name || value <= 0) {
        alert("Please enter a valid discount name and value.");
        return;
    }

    if (type === "Percentage" && value > 100) {
        alert("Percentage discount cannot exceed 100%.");
        return;
    }

    if (minimumPurchase < 0 || minimumQuantity < 1 ||
        (usageLimit !== null && usageLimit < 1)) {
        alert("Please enter valid minimum and usage limits.");
        return;
    }

    if (!startDate || !endDate || endDate < startDate) {
        alert("Please enter valid dates. Expiry date must be on or after the start date.");
        return;
    }

    const existingDiscount = discountId
        ? discounts.find(d => d.id === discountId)
        : null;

    const discountData = {
        id: discountId || "discount_" + Date.now(),
        name,
        type,
        value,
        minimumPurchase,
        minimumQuantity,
        startDate,
        endDate,
        usageLimit,
        usedCount: existingDiscount ? existingDiscount.usedCount || 0 : 0
    };

    if (existingDiscount) {
        const index = discounts.findIndex(d => d.id === discountId);
        discounts[index] = discountData;
    } else {
        discounts.push(discountData);
    }

    saveDiscountsToStorage();
    closeDiscountModal();
    renderDiscountsTable();

    alert("Discount saved successfully!");
}

function deleteDiscount(discountId) {
    const confirmDelete = confirm(
        "Are you sure you want to delete this discount?"
    );

    if (!confirmDelete) return;

    discounts = discounts.filter(
        discount => discount.id !== discountId
    );

    saveDiscountsToStorage();
    renderDiscountsTable();

    alert("Discount deleted successfully!");
}

/* ========================================
   AUTOMATIC DISCOUNT CALCULATION
======================================== */

function calculateApplicableDiscount(subscription, billingDate) {

    const subtotal = Number(subscription.totalAmount);
    const quantity = Number(subscription.quantity) || 1;

    const eligibleDiscounts = discounts.filter(discount => {

        // Check discount date range
        if (billingDate < discount.startDate ||
            billingDate > discount.endDate) {
            return false;
        }

        // Check minimum purchase
        if (subtotal < Number(discount.minimumPurchase || 0)) {
            return false;
        }

        // Check minimum quantity
        if (quantity < Number(discount.minimumQuantity || 1)) {
            return false;
        }

        // Check usage limit
        if (discount.usageLimit !== null &&
            discount.usageLimit !== "" &&
            Number(discount.usedCount || 0) >= Number(discount.usageLimit)) {
            return false;
        }

        return true;
    });

    if (eligibleDiscounts.length === 0) {
        return null;
    }

    // Calculate savings for every eligible discount
    const calculatedDiscounts = eligibleDiscounts.map(discount => {

        let discountAmount = 0;

        if (discount.type === "Percentage") {
            discountAmount = subtotal * (discount.value / 100);
        } else {
            discountAmount = Number(discount.value);
        }

        // Discount cannot exceed invoice subtotal
        discountAmount = Math.min(discountAmount, subtotal);

        return {
            discount,
            discountAmount
        };
    });

    // Apply the discount that gives the highest savings
    calculatedDiscounts.sort(
        (a, b) => b.discountAmount - a.discountAmount
    );

    return calculatedDiscounts[0];
}   


/* =====================================================
   12. OTHER PAGE PLACEHOLDERS
===================================================== */

function showPlaceholderPage(pageName) {

    mainContent.innerHTML = `

        <header class="topbar">
            <div class="search-box">
                <span>⌕</span>
                <input type="text"
                    placeholder="Search ${escapeHTML(pageName)}...">
            </div>
        </header>

        <section class="welcome-section">
            <div>
                <p class="eyebrow">WORKSPACE</p>
                <h1>${escapeHTML(pageName)}</h1>
                <p class="subtitle">
                    Manage your ${escapeHTML(pageName.toLowerCase())} here.
                </p>
            </div>
        </section>

        <section class="content-card">
            <h3>${escapeHTML(pageName)} Management</h3>
            <p class="subtitle">
                This section will be developed next.
            </p>
        </section>

        <footer>© 2026 Brightloop Software</footer>
    `;
}


/* =====================================================
   13. INITIAL PAGE
===================================================== */

const savedPage = localStorage.getItem("brightloopCurrentPage") || "Dashboard";

activateSidebarPage(savedPage);
showPage(savedPage);

/* ========================================
   REPORTS & ANALYTICS
======================================== */

function showReportsPage() {

    const totalRevenue = invoices.reduce(
        (sum, invoice) => sum + Number(invoice.amountPaid || 0),
        0
    );

    const outstandingAmount = invoices.reduce(
        (sum, invoice) =>
            sum + Math.max(
                0,
                Number(invoice.amount || 0) -
                Number(invoice.amountPaid || 0)
            ),
        0
    );

    const activeSubscriptions = subscriptions.filter(
        subscription =>
            ["Active", "Confirmed"].includes(subscription.status)
    ).length;

    const totalInvoices = invoices.length;

    mainContent.innerHTML = `
        <div class="page-header">
            <div>
                <h1>Reports & Analytics</h1>
                <p>Track your business performance and financial activity.</p>
            </div>
        </div>

        <div class="reports-grid">

            <div class="report-stat-card">
                <div class="report-stat-icon">💰</div>
                <p>Total Revenue Collected</p>
                <h2>${formatPrice(totalRevenue)}</h2>
                <small>Payments received from invoices</small>
            </div>

            <div class="report-stat-card">
                <div class="report-stat-icon">📊</div>
                <p>Outstanding Payments</p>
                <h2>${formatPrice(outstandingAmount)}</h2>
                <small>Amount yet to be collected</small>
            </div>

            <div class="report-stat-card">
                <div class="report-stat-icon">🔄</div>
                <p>Active Subscriptions</p>
                <h2>${activeSubscriptions}</h2>
                <small>Confirmed and active subscriptions</small>
            </div>

            <div class="report-stat-card">
                <div class="report-stat-icon">🧾</div>
                <p>Total Invoices</p>
                <h2>${totalInvoices}</h2>
                <small>Invoices generated</small>
            </div>

        </div>

        <div class="content-card revenue-chart-card">
            <div class="card-header">
                <h2>Monthly Revenue</h2>
                <span>Payments collected over the last 6 months</span>
            </div>

            <div id="monthlyRevenueChart" class="monthly-revenue-chart"></div>
        </div>
        <div class="content-card reports-overview">
            <div class="card-header">
                <h2>Business Overview</h2>
            </div>

            <div class="reports-overview-content">
                <p>
                    <strong>${invoices.filter(i => i.status === "Paid").length}</strong>
                    Fully Paid Invoices
                </p>

                <p>
                    <strong>${invoices.filter(i =>
                        ["Confirmed", "Partially Paid"].includes(i.status)
                    ).length}</strong>
                    Pending Invoices
                </p>

                <p>
                    <strong>${subscriptions.length}</strong>
                    Total Subscriptions
                </p>

                <p>
                    <strong>${customers.length}</strong>
                    Total Customers
                </p>
            </div>
        </div>
        `;

        // Generate Monthly Revenue Chart
        const chartContainer = document.getElementById("monthlyRevenueChart");

        const monthlyRevenue = {};

        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setDate(1);
            date.setMonth(date.getMonth() - i);

            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

            monthlyRevenue[key] = {
                label: date.toLocaleString("en-IN", { month: "short" }),
                amount: 0
            };
        }

        invoices.forEach(invoice => {
            if (!invoice.issueDate) return;

            const date = new Date(invoice.issueDate + "T00:00:00");
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

            if (monthlyRevenue[key]) {
                monthlyRevenue[key].amount += Number(invoice.amountPaid || 0);
            }
        });

        const maxRevenue = Math.max(
            1,
            ...Object.values(monthlyRevenue).map(item => item.amount)
        );

        chartContainer.innerHTML = Object.values(monthlyRevenue).map(item => {

            const height = (item.amount / maxRevenue) * 100;

            return `
                <div class="revenue-bar-item">
                    <div class="revenue-bar-value">${formatPrice(item.amount)}</div>
                    <div class="revenue-bar-track">
                        <div class="revenue-bar-fill" style="height: ${height}%"></div>
                    </div>
                    <span>${item.label}</span>
                </div>
            `;
        }).join("");
    }
    function renderDashboardRevenueChart() {

    const chartContainer = document.getElementById("dashboardRevenueChart");

    if (!chartContainer) return;

    const monthlyRevenue = {};

    // Prepare the last 6 months
    for (let i = 5; i >= 0; i--) {

        const date = new Date();
        date.setDate(1);
        date.setMonth(date.getMonth() - i);

        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

        monthlyRevenue[key] = {
            label: date.toLocaleString("en-IN", { month: "short" }),
            amount: 0
        };
    }

    // Calculate collected revenue
    invoices.forEach(invoice => {

        if (!invoice.issueDate) return;

        const date = new Date(invoice.issueDate + "T00:00:00");

        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

        if (monthlyRevenue[key]) {
            monthlyRevenue[key].amount += Number(invoice.amountPaid || 0);
        }
    });

    const maxRevenue = Math.max(
        1,
        ...Object.values(monthlyRevenue).map(item => item.amount)
    );

    chartContainer.innerHTML = Object.values(monthlyRevenue).map(item => {

        const height = (item.amount / maxRevenue) * 100;

        return `
            <div class="revenue-bar-item">
                <div class="revenue-bar-value">
                    ${formatPrice(item.amount)}
                </div>

                <div class="revenue-bar-track">
                    <div class="revenue-bar-fill"
                         style="height: ${height}%"></div>
                </div>

                <span>${item.label}</span>
            </div>
        `;

    }).join("");
}
function renderDashboardStats() {

    console.log("Dashboard invoice count:", invoices.length);
    console.log("Dashboard subscription count:", subscriptions.length);
    console.log("Dashboard invoices:", invoices);

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Monthly revenue collected
    const monthlyRevenue = invoices.reduce((sum, invoice) => {

        if (!invoice.issueDate) return sum;

        const date = new Date(invoice.issueDate + "T00:00:00");

        if (
            date.getMonth() === currentMonth &&
            date.getFullYear() === currentYear
        ) {
            return sum + Number(invoice.amountPaid || 0);
        }

        return sum;

    }, 0);

    // Active subscriptions
    const activeCount = subscriptions.filter(
        subscription => subscription.status === "Active"
    ).length;

    // Outstanding payments
    const outstanding = invoices.reduce((sum, invoice) => {

        return sum + Math.max(
            0,
            Number(invoice.amount || 0) -
            Number(invoice.amountPaid || 0)
        );

    }, 0);

    // Pending invoices
    const pendingCount = invoices.filter(invoice =>
        ["Confirmed", "Partially Paid"].includes(invoice.status) &&
        Number(invoice.amount) > Number(invoice.amountPaid || 0)
    ).length;

    // Overdue invoices
    const overdueCount = invoices.filter(invoice => {

        if (!invoice.dueDate) return false;

        return (
            invoice.dueDate < getLocalToday() &&
            Number(invoice.amount) > Number(invoice.amountPaid || 0)
        );

    }).length;

    document.getElementById("dashboardMonthlyRevenue").textContent =
        formatPrice(monthlyRevenue);

    document.getElementById("dashboardActiveSubscriptions").textContent =
        activeCount;

    document.getElementById("dashboardOutstanding").textContent =
        formatPrice(outstanding);

    document.getElementById("dashboardPendingInvoices").textContent =
        `${pendingCount} invoices awaiting payment`;

    document.getElementById("dashboardOverdueInvoices").textContent =
        overdueCount;
}

function showSettingsPage() {
    const settings = JSON.parse(localStorage.getItem("brightloopSettings")) || {
        businessName: "Brightloop",
        email: "",
        currency: "INR",
        timezone: "Asia/Kolkata",
        billingCycle: "Monthly",
        dueDays: 7,
        paymentReminders: true,
        overdueAlerts: true
    };

    mainContent.innerHTML = `
        <div class="page-header">
            <div>
                <h1>Settings</h1>
                <p>Manage your business preferences and account.</p>
            </div>
        </div>

        <div class="settings-container">
            <div class="settings-card">
                <h2>🏢 Business Information</h2>
                <label>Business Name</label>
                <input id="settingBusiness" value="${settings.businessName}" />

                <label>Admin Email</label>
                <input id="settingEmail" type="email" value="${settings.email}" />

                <label>Currency</label>
                <select id="settingCurrency">
                    <option value="INR" ${settings.currency === "INR" ? "selected" : ""}>INR (₹)</option>
                    <option value="USD" ${settings.currency === "USD" ? "selected" : ""}>USD ($)</option>
                    <option value="EUR" ${settings.currency === "EUR" ? "selected" : ""}>EUR (€)</option>
                </select>

                <label>Timezone</label>
                <select id="settingTimezone">
                    <option value="Asia/Kolkata" ${settings.timezone === "Asia/Kolkata" ? "selected" : ""}>India (IST)</option>
                    <option value="UTC" ${settings.timezone === "UTC" ? "selected" : ""}>UTC</option>
                </select>
            </div>

            <div class="settings-card">
                <h2>💳 Billing Preferences</h2>
                <label>Default Billing Cycle</label>
                <select id="settingCycle">
                    <option ${settings.billingCycle === "Monthly" ? "selected" : ""}>Monthly</option>
                    <option ${settings.billingCycle === "Weekly" ? "selected" : ""}>Weekly</option>
                    <option ${settings.billingCycle === "Yearly" ? "selected" : ""}>Yearly</option>
                </select>

                <label>Invoice Due Days</label>
                <input id="settingDueDays" type="number" min="1" value="${settings.dueDays}" />
            </div>

            <div class="settings-card">
                <h2>🔔 Notifications</h2>
                <label>
                    <input id="settingReminders" type="checkbox" ${settings.paymentReminders ? "checked" : ""} />
                    Payment reminders
                </label>
                <label>
                    <input id="settingAlerts" type="checkbox" ${settings.overdueAlerts ? "checked" : ""} />
                    Overdue invoice alerts
                </label>
            </div>

            <button class="btn btn-primary" onclick="saveBrightloopSettings()">
                Save Settings
            </button>
            <p id="settingsMessage"></p>
        </div>
    `;
}

function saveBrightloopSettings() {
    const settings = {
        businessName: document.getElementById("settingBusiness").value.trim(),
        email: document.getElementById("settingEmail").value.trim(),
        currency: document.getElementById("settingCurrency").value,
        timezone: document.getElementById("settingTimezone").value,
        billingCycle: document.getElementById("settingCycle").value,
        dueDays: Number(document.getElementById("settingDueDays").value),
        paymentReminders: document.getElementById("settingReminders").checked,
        overdueAlerts: document.getElementById("settingAlerts").checked
    };

    if (!settings.businessName || settings.dueDays < 1) {
        alert("Please enter a business name and valid invoice due days.");
        return;
    }

    localStorage.setItem("brightloopSettings", JSON.stringify(settings));
    document.getElementById("settingsMessage").textContent = "Settings saved successfully!";
}

function showLoginScreen() {
    document.getElementById("loginScreen").style.display = "flex";
    document.getElementById("appContainer").style.display = "none";
}

function showApp() {
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("appContainer").style.display = "flex";
}

document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("loginForm");

    if (localStorage.getItem("brightloopLoggedIn") === "true") {
        showApp();
    } else {
        showLoginScreen();
    }

    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        if (!email || password.length < 4) {
            alert("Please enter a valid email and a password of at least 4 characters.");
            return;
        }

        localStorage.setItem("brightloopLoggedIn", "true");
        localStorage.setItem("brightloopUserEmail", email);

        showApp();
        showPage("Dashboard");
    });
});
// Dashboard search
document.addEventListener("input", function (event) {
    if (event.target.id !== "dashboardSearch") return;

    const query = event.target.value.toLowerCase().trim();
    const rows = document.querySelectorAll("main.main-content table tbody tr");

    rows.forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(query)
            ? ""
            : "none";
    });
});