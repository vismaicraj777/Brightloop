
/* =====================================================
   BRIGHTLOOP - SUBSCRIPTION MANAGEMENT SYSTEM
   Dashboard + Customers + Products + Subscriptions + Invoices
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

    if (pageName === "Dashboard") {
        mainContent.innerHTML = dashboardHTML;
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

                <div class="form-group">
                    <label>Subscription Amount</label>
                    <input type="text" id="subscriptionAmountPreview"
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
                <span>Unpaid invoice value</span>
            </div>

        </section>

        <section class="content-card">

            <h3>All Invoices</h3>

            <p class="subtitle">
                View invoice details and update payment status.
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
                updateInvoiceStatus(index, "Paid");
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
                <td colspan="8">
                    No invoices found. Generate an invoice from a subscription.
                </td>
            </tr>
        `;

        updateInvoiceStats();
        return;
    }

    invoiceList.forEach(invoice => {

        const index = invoices.indexOf(invoice);
        const statusClass = invoice.status.toLowerCase();

        let actionButtons = "";

        if (invoice.status === "Draft") {
            actionButtons = `
                <button class="customer-action-btn confirm-invoice-btn"
                    data-index="${index}">Confirm</button>
            `;
        }

        if (invoice.status === "Confirmed") {
            actionButtons = `
                <button class="customer-action-btn pay-invoice-btn"
                    data-index="${index}">Mark Paid</button>
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
            <td>${formatPrice(invoice.amount)}</td>

            <td>
                <span class="status ${statusClass}">
                    ${escapeHTML(invoice.status)}
                </span>
            </td>

            <td>
                ${actionButtons}

                <button class="customer-action-btn delete-invoice-btn"
                    data-index="${index}">Delete</button>
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
        .filter(invoice => invoice.status !== "Paid")
        .reduce((sum, invoice) => sum + Number(invoice.amount), 0);

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

        amount: Number(subscription.totalAmount),

        status: "Draft",

        createdAt: new Date().toISOString()
    };

    invoices.push(invoice);

    saveInvoicesToStorage();

    // Move the next billing date forward.
    subscription.nextBilling = calculateNextBilling(
        billingDate,
        subscription.frequency
    );

    saveSubscriptionsToStorage();

    alert(`Invoice ${invoice.id} generated successfully!`);

    // Automatically activate the Invoices sidebar item.
    activateSidebarPage("Invoices");

    // Open the Invoices page.
    showInvoicesPage();
}


/* ---------- UPDATE INVOICE STATUS ---------- */

function updateInvoiceStatus(index, newStatus) {

    const invoice = invoices[index];
    if (!invoice) return;

    if (newStatus === "Confirmed") {

        if (invoice.status !== "Draft") return;

        if (!confirm(`Confirm invoice ${invoice.id}?`)) return;

        invoice.status = "Confirmed";
        invoice.confirmedAt = new Date().toISOString();
    }

    if (newStatus === "Paid") {

        if (invoice.status !== "Confirmed") return;

        if (!confirm(`Mark invoice ${invoice.id} as paid?`)) return;

        invoice.status = "Paid";
        invoice.paidAt = new Date().toISOString();
        invoice.paymentMethod = "Not specified";
    }

    saveInvoicesToStorage();
    renderInvoices();
}


/* ---------- DELETE INVOICE ---------- */

function deleteInvoice(index) {

    const invoice = invoices[index];
    if (!invoice) return;

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
   9. DATE HELPERS
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
   10. SHARED HELPER FUNCTIONS
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


/* =====================================================
   11. OTHER PAGE PLACEHOLDERS
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
   12. INITIAL PAGE
===================================================== */

showPage("Dashboard");
