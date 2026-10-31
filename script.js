/* ==========================================
   BRIGHTLOOP - SUBSCRIPTION MANAGEMENT SYSTEM
========================================== */


/* ---------- 1. INITIAL SETUP ---------- */

const navLinks = document.querySelectorAll(".nav-link");
const mainContent = document.querySelector(".main-content");

const dashboardHTML = mainContent.innerHTML;


/* ---------- 2. CUSTOMER DATA ---------- */

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

function saveCustomersToStorage() {
    localStorage.setItem(
        "brightloopCustomers",
        JSON.stringify(customers)
    );
}


/* ---------- 3. PRODUCT DATA ---------- */

let products = JSON.parse(
    localStorage.getItem("brightloopProducts")
) || [];

function saveProductsToStorage() {
    localStorage.setItem(
        "brightloopProducts",
        JSON.stringify(products)
    );
}


/* ---------- 4. SIDEBAR NAVIGATION ---------- */

navLinks.forEach(link => {

    link.addEventListener("click", function(event) {

        event.preventDefault();

        navLinks.forEach(nav => {
            nav.classList.remove("active");
        });

        this.classList.add("active");

        showPage(this.dataset.page);

    });

});


/* ---------- 5. PAGE NAVIGATION ---------- */

function showPage(pageName) {

    if (pageName === "Dashboard") {

        mainContent.innerHTML = dashboardHTML;

        return;
    }

    if (pageName === "Customers") {

        showCustomersPage();

        return;
    }

    if (pageName === "Products" || pageName === "Products & Plans") {

        showProductsPage();

        return;
    }

    showPlaceholderPage(pageName);

}


/* ==========================================
   CUSTOMERS MODULE
========================================== */


/* ---------- 6. CUSTOMERS PAGE ---------- */

function showCustomersPage() {

    mainContent.innerHTML = `

        <header class="topbar">

            <div class="search-box">
                <span>⌕</span>

                <input
                    type="text"
                    id="customerSearch"
                    placeholder="Search customers..."
                >
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


        <footer>
            © 2026 Brightloop Software
        </footer>

    `;


    renderCustomers();

    document
        .getElementById("addCustomerBtn")
        .addEventListener("click", () => openCustomerModal());

    document
        .getElementById("customerSearch")
        .addEventListener("input", searchCustomers);

    document
        .getElementById("customerTableBody")
        .addEventListener("click", function(event) {

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


/* ---------- 7. RENDER CUSTOMERS ---------- */

function renderCustomers(customerList = customers) {

    const tableBody = document.getElementById("customerTableBody");

    if (!tableBody) return;

    tableBody.innerHTML = "";

    if (customerList.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="5">No customers found.</td>
            </tr>
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
                <button
                    class="customer-action-btn edit-btn"
                    data-index="${index}"
                >
                    Edit
                </button>

                <button
                    class="customer-action-btn delete-btn"
                    data-index="${index}"
                >
                    Delete
                </button>
            </td>
        `;

        tableBody.appendChild(row);

    });

}


/* ---------- 8. CUSTOMER MODAL ---------- */

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
                    <h2>
                        ${isEditing ? "Edit Customer" : "Add New Customer"}
                    </h2>

                    <p>
                        ${isEditing
                            ? "Update customer information."
                            : "Enter the details of your new customer."
                        }
                    </p>
                </div>

                <button
                    type="button"
                    class="modal-close"
                    id="closeCustomerModal"
                >
                    &times;
                </button>

            </div>


            <form id="customerForm">

                <div class="form-group">
                    <label for="customerName">Customer Name</label>

                    <input
                        type="text"
                        id="customerName"
                        placeholder="Enter customer name"
                        required
                    >
                </div>


                <div class="form-group">
                    <label for="customerEmail">Email Address</label>

                    <input
                        type="email"
                        id="customerEmail"
                        placeholder="Enter email address"
                        required
                    >
                </div>


                <div class="form-group">
                    <label for="customerPhone">Phone Number</label>

                    <input
                        type="tel"
                        id="customerPhone"
                        placeholder="Enter phone number"
                        required
                    >
                </div>


                <div class="form-group">
                    <label for="customerStatus">Customer Status</label>

                    <select id="customerStatus">
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </div>


                <div class="modal-actions">

                    <button type="button" id="cancelCustomer">
                        Cancel
                    </button>

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

    document
        .getElementById("closeCustomerModal")
        .addEventListener("click", closeCustomerModal);

    document
        .getElementById("cancelCustomer")
        .addEventListener("click", closeCustomerModal);

    document
        .getElementById("customerForm")
        .addEventListener("submit", event => {
            saveCustomer(event, customerIndex);
        });

    modal.addEventListener("click", event => {

        if (event.target === modal) {
            closeCustomerModal();
        }

    });

}


/* ---------- 9. SAVE CUSTOMER ---------- */

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

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
        alert("Please enter a valid email address.");
        return;
    }

    if (!/^[+0-9()\-\s]{7,20}$/.test(phone)) {
        alert("Please enter a valid phone number.");
        return;
    }

    const emailExists = customers.some((customer, index) => {

        return (
            customer.email.toLowerCase() === email.toLowerCase() &&
            index !== customerIndex
        );

    });

    if (emailExists) {
        alert("A customer with this email already exists.");
        return;
    }

    const customerData = {
        name,
        email,
        phone,
        status
    };

    if (customerIndex !== null) {

        customers[customerIndex] = customerData;

    } else {

        customers.push(customerData);

    }

    saveCustomersToStorage();

    closeCustomerModal();

    searchCustomers();

    alert(
        customerIndex !== null
            ? "Customer updated successfully!"
            : "Customer added successfully!"
    );

}


/* ---------- 10. CLOSE CUSTOMER MODAL ---------- */

function closeCustomerModal() {

    const modal = document.getElementById("customerModal");

    if (modal) modal.remove();

}


/* ---------- 11. DELETE CUSTOMER ---------- */

function deleteCustomer(index) {

    const customer = customers[index];

    if (!customer) return;

    if (!confirm(`Are you sure you want to delete ${customer.name}?`)) {
        return;
    }

    customers.splice(index, 1);

    saveCustomersToStorage();

    searchCustomers();

    alert("Customer deleted successfully!");

}


/* ---------- 12. SEARCH CUSTOMERS ---------- */

function searchCustomers() {

    const searchValue = document
        .getElementById("customerSearch")
        .value.toLowerCase()
        .trim();

    const filteredCustomers = customers.filter(customer => {

        return (
            customer.name.toLowerCase().includes(searchValue) ||
            customer.email.toLowerCase().includes(searchValue) ||
            customer.phone.toLowerCase().includes(searchValue)
        );

    });

    renderCustomers(filteredCustomers);

}


/* ==========================================
   PRODUCTS MODULE
========================================== */


/* ---------- 13. PRODUCTS PAGE ---------- */

function showProductsPage() {

    mainContent.innerHTML = `

        <header class="topbar">

            <div class="search-box">
                <span>⌕</span>

                <input
                    type="text"
                    id="productSearch"
                    placeholder="Search products..."
                >
            </div>

        </header>


        <section class="welcome-section">

            <div>
                <p class="eyebrow">WORKSPACE</p>

                <h1>Products</h1>

                <p class="subtitle">
                    Manage your products, pricing and plans.
                </p>
            </div>

            <button class="date-button" id="addProductBtn">
                + Add Product
            </button>

        </section>


        <section class="content-card">

            <h3>All Products</h3>

            <p class="subtitle">
                View and manage your product catalogue.
            </p>

            <table>

                <thead>
                    <tr>
                        <th>Product Name</th>
                        <th>Product Type</th>
                        <th>Sales Price</th>
                        <th>Cost Price</th>
                        <th>Variants</th>
                        <th>Actions</th>
                    </tr>
                </thead>

                <tbody id="productTableBody"></tbody>

            </table>

        </section>


        <footer>
            © 2026 Brightloop Software
        </footer>

    `;


    renderProducts();

    document
        .getElementById("addProductBtn")
        .addEventListener("click", () => openProductModal());

    document
        .getElementById("productSearch")
        .addEventListener("input", searchProducts);

    document
        .getElementById("productTableBody")
        .addEventListener("click", function(event) {

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


/* ---------- 14. RENDER PRODUCTS ---------- */

function renderProducts(productList = products) {

    const tableBody = document.getElementById("productTableBody");

    if (!tableBody) return;

    tableBody.innerHTML = "";

    if (productList.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="6">No products found.</td>
            </tr>
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

                <button
                    class="customer-action-btn edit-btn"
                    data-index="${index}"
                >
                    Edit
                </button>

                <button
                    class="customer-action-btn delete-btn"
                    data-index="${index}"
                >
                    Delete
                </button>

            </td>

        `;

        tableBody.appendChild(row);

    });

}


/* ---------- 15. ADD / EDIT PRODUCT MODAL ---------- */

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
                    <h2>
                        ${isEditing ? "Edit Product" : "Add New Product"}
                    </h2>

                    <p>
                        Enter your product information below.
                    </p>
                </div>

                <button
                    type="button"
                    class="modal-close"
                    id="closeProductModal"
                >
                    &times;
                </button>

            </div>


            <form id="productForm">

                <div class="form-group">

                    <label for="productName">Product Name</label>

                    <input
                        type="text"
                        id="productName"
                        placeholder="e.g. Brightloop CRM"
                        required
                    >

                </div>


                <div class="form-group">

                    <label for="productType">Product Type</label>

                    <select id="productType" required>

                        <option value="">Select product type</option>

                        <option value="Service">Service</option>

                        <option value="Software">Software</option>

                        <option value="Physical">Physical Product</option>

                        <option value="Digital">Digital Product</option>

                    </select>

                </div>


                <div class="form-group">

                    <label for="salesPrice">Sales Price (₹)</label>

                    <input
                        type="number"
                        id="salesPrice"
                        placeholder="Enter sales price"
                        min="0"
                        step="0.01"
                        required
                    >

                </div>


                <div class="form-group">

                    <label for="costPrice">Cost Price (₹)</label>

                    <input
                        type="number"
                        id="costPrice"
                        placeholder="Enter cost price"
                        min="0"
                        step="0.01"
                        required
                    >

                </div>


                <div class="form-group">

                    <label for="productNotes">Notes</label>

                    <textarea
                        id="productNotes"
                        placeholder="Additional product information"
                        rows="3"
                    ></textarea>

                </div>


                <section class="variants-section">

                    <div class="variants-heading">

                        <div>
                            <h3>Product Variants</h3>
                            <p>Add different versions with additional pricing.</p>
                        </div>

                        <button
                            type="button"
                            class="add-variant-btn"
                            id="addVariantBtn"
                        >
                            + Add Variant
                        </button>

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

                    <button type="button" id="cancelProduct">
                        Cancel
                    </button>

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

        (product.variants || []).forEach(variant => {
            addVariantRow(variant);
        });

    }


    document
        .getElementById("closeProductModal")
        .addEventListener("click", closeProductModal);

    document
        .getElementById("cancelProduct")
        .addEventListener("click", closeProductModal);


    const addVariantBtn = document.getElementById("addVariantBtn");

    if (addVariantBtn) {

        addVariantBtn.addEventListener("click", () => {
            addVariantRow();
        });

    }


    document
        .getElementById("productForm")
        .addEventListener("submit", event => {
            saveProduct(event, productIndex);
        });

    modal.addEventListener("click", event => {

        if (event.target === modal) {
            closeProductModal();
        }

    });

}


/* ---------- PRODUCT VARIANT ROWS ---------- */

function addVariantRow(variant = null) {

    const variantRows = document.getElementById("variantRows");

    if (!variantRows) return;

    const row = document.createElement("div");

    row.className = "variant-row";

    row.innerHTML = `
        <input
            type="text"
            class="variant-name"
            placeholder="e.g. Premium"
            value="${variant ? escapeHTML(variant.name) : ""}"
        >

        <input
            type="number"
            class="variant-price"
            min="0"
            step="0.01"
            placeholder="e.g. 560"
            value="${variant ? Number(variant.priceAddon) : ""}"
        >

        <button
            type="button"
            class="remove-variant-btn"
            title="Remove variant"
        >
            &times;
        </button>
    `;

    row
        .querySelector(".remove-variant-btn")
        .addEventListener("click", () => {
            row.remove();
        });

    variantRows.appendChild(row);

}


/* ---------- 16. SAVE PRODUCT ---------- */

function saveProduct(event, productIndex = null) {

    event.preventDefault();

    const name = document.getElementById("productName").value.trim();

    const type = document.getElementById("productType").value;

    const salesPrice = Number(
        document.getElementById("salesPrice").value
    );

    const costPrice = Number(
        document.getElementById("costPrice").value
    );

    const notes = document.getElementById("productNotes").value.trim();


    if (name.length < 2) {

        alert("Please enter a valid product name.");

        return;
    }


    if (!type) {

        alert("Please select a product type.");

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


    const duplicateProduct = products.some((product, index) => {

        return (
            product.name.toLowerCase() === name.toLowerCase() &&
            index !== productIndex
        );

    });


    if (duplicateProduct) {

        alert("A product with this name already exists.");

        return;
    }


    // Collect product variants

    const variantRows = document.querySelectorAll(
        "#variantRows .variant-row"
    );

    const variants = [];

    const variantNames = new Set();


    for (const row of variantRows) {

        const variantName = row
            .querySelector(".variant-name")
            .value.trim();

        const priceValue = row
            .querySelector(".variant-price")
            .value.trim();


        if (!variantName && !priceValue) continue;


        if (!variantName || priceValue === "") {

            alert("Please enter both a variant name and its additional price.");

            return;
        }


        const priceAddon = Number(priceValue);


        if (!Number.isFinite(priceAddon) || priceAddon < 0) {

            alert("Variant additional price must be a valid non-negative number.");

            return;
        }


        if (variantNames.has(variantName.toLowerCase())) {

            alert("Variant names must be unique within a product.");

            return;
        }


        variantNames.add(variantName.toLowerCase());

        variants.push({
            name: variantName,
            priceAddon
        });

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

    alert(
        productIndex !== null
            ? "Product updated successfully!"
            : "Product added successfully!"
    );

}


/* ---------- 17. CLOSE PRODUCT MODAL ---------- */

function closeProductModal() {

    const modal = document.getElementById("productModal");

    if (modal) modal.remove();

}


/* ---------- 18. DELETE PRODUCT ---------- */

function deleteProduct(index) {

    const product = products[index];

    if (!product) return;

    if (!confirm(`Are you sure you want to delete ${product.name}?`)) {
        return;
    }

    products.splice(index, 1);

    saveProductsToStorage();

    searchProducts();

    alert("Product deleted successfully!");

}


/* ---------- 19. SEARCH PRODUCTS ---------- */

function searchProducts() {

    const searchValue = document
        .getElementById("productSearch")
        .value.toLowerCase()
        .trim();

    const filteredProducts = products.filter(product => {

        return (
            product.name.toLowerCase().includes(searchValue) ||

            product.type.toLowerCase().includes(searchValue) ||

            (product.variants || []).some(variant =>
                variant.name.toLowerCase().includes(searchValue)
            )
        );

    });

    renderProducts(filteredProducts);

}


/* ==========================================
   SHARED HELPER FUNCTIONS
========================================== */


/* ---------- 20. FORMAT PRICE ---------- */

function formatPrice(price) {

    return "₹" + Number(price).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

}


/* ---------- 21. ESCAPE HTML ---------- */

function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, character => {

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


/* ---------- 22. OTHER PAGE PLACEHOLDERS ---------- */

function showPlaceholderPage(pageName) {

    mainContent.innerHTML = `

        <header class="topbar">

            <div class="search-box">

                <span>⌕</span>

                <input
                    type="text"
                    placeholder="Search ${escapeHTML(pageName)}..."
                >

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


        <footer>
            © 2026 Brightloop Software
        </footer>

    `;

}


/* ---------- 23. INITIAL PAGE ---------- */

showPage("Dashboard");