
/* ==========================================
   BRIGHTLOOP - SUBSCRIPTION MANAGEMENT SYSTEM
   ========================================== */


/* ---------- 1. INITIAL SETUP ---------- */

const navLinks = document.querySelectorAll(".nav-link");
const mainContent = document.querySelector(".main-content");

// Save the original dashboard
const dashboardHTML = mainContent.innerHTML;


/* ---------- 2. CUSTOMER DATA ---------- */

let customers = [
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


/* ---------- 3. SIDEBAR NAVIGATION ---------- */

navLinks.forEach(link => {

    link.addEventListener("click", function(event) {

        event.preventDefault();

        navLinks.forEach(nav => {
            nav.classList.remove("active");
        });

        this.classList.add("active");

        const pageName = this.dataset.page;

        showPage(pageName);

    });

});


/* ---------- 4. PAGE NAVIGATION ---------- */

function showPage(pageName) {

    if (pageName === "Dashboard") {

        mainContent.innerHTML = dashboardHTML;

        return;
    }

    if (pageName === "Customers") {

        showCustomersPage();

        return;
    }

    showPlaceholderPage(pageName);

}


/* ---------- 5. CUSTOMERS PAGE ---------- */

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
        .addEventListener("click", openCustomerModal);

    document
        .getElementById("customerSearch")
        .addEventListener("input", searchCustomers);

}


/* ---------- 6. RENDER CUSTOMER TABLE ---------- */

function renderCustomers(customerList = customers) {

    const tableBody = document.getElementById("customerTableBody");

    if (!tableBody) return;

    tableBody.innerHTML = "";

    if (customerList.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="4">No customers found.</td>
            </tr>
        `;

        return;
    }

    customerList.forEach(customer => {

        const row = document.createElement("tr");

        const nameCell = document.createElement("td");
        nameCell.textContent = customer.name;

        const emailCell = document.createElement("td");
        emailCell.textContent = customer.email;

        const phoneCell = document.createElement("td");
        phoneCell.textContent = customer.phone;

        const statusCell = document.createElement("td");

        const statusBadge = document.createElement("span");

        statusBadge.className =
            customer.status === "Active"
                ? "status active"
                : "status pending";

        statusBadge.textContent = customer.status;

        statusCell.appendChild(statusBadge);

        row.append(
            nameCell,
            emailCell,
            phoneCell,
            statusCell
        );

        tableBody.appendChild(row);

    });

}


/* ---------- 7. OPEN ADD CUSTOMER MODAL ---------- */

function openCustomerModal() {

    // Prevent multiple modals
    if (document.getElementById("customerModal")) return;

    const modal = document.createElement("div");

    modal.id = "customerModal";
    modal.className = "customer-modal-overlay";

    modal.innerHTML = `

        <div class="customer-modal">

            <div class="modal-header">

                <div>
                    <h2>Add New Customer</h2>

                    <p>
                        Enter the details of your new customer.
                    </p>
                </div>

                <button
                    type="button"
                    class="modal-close"
                    id="closeCustomerModal"
                    aria-label="Close"
                >
                    &times;
                </button>

            </div>


            <form id="customerForm">

                <div class="form-group">

                    <label for="customerName">
                        Customer Name
                    </label>

                    <input
                        type="text"
                        id="customerName"
                        placeholder="Enter customer name"
                        required
                    >

                </div>


                <div class="form-group">

                    <label for="customerEmail">
                        Email Address
                    </label>

                    <input
                        type="email"
                        id="customerEmail"
                        placeholder="Enter email address"
                        required
                    >

                </div>


                <div class="form-group">

                    <label for="customerPhone">
                        Phone Number
                    </label>

                    <input
                        type="tel"
                        id="customerPhone"
                        placeholder="Enter phone number"
                        required
                    >

                </div>


                <div class="form-group">

                    <label for="customerStatus">
                        Customer Status
                    </label>

                    <select id="customerStatus">

                        <option value="Active">Active</option>

                        <option value="Inactive">Inactive</option>

                    </select>

                </div>


                <div class="modal-actions">

                    <button
                        type="button"
                        class="cancel-btn"
                        id="cancelCustomer"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        class="save-btn"
                    >
                        Save Customer
                    </button>

                </div>

            </form>

        </div>

    `;

    document.body.appendChild(modal);

    // Close button
    document
        .getElementById("closeCustomerModal")
        .addEventListener("click", closeCustomerModal);

    // Cancel button
    document
        .getElementById("cancelCustomer")
        .addEventListener("click", closeCustomerModal);

    // Form submission
    document
        .getElementById("customerForm")
        .addEventListener("submit", saveCustomer);

    // Close when clicking outside the form
    modal.addEventListener("click", function(event) {

        if (event.target === modal) {
            closeCustomerModal();
        }

    });

}


/* ---------- 8. CLOSE CUSTOMER MODAL ---------- */

function closeCustomerModal() {

    const modal = document.getElementById("customerModal");

    if (modal) {
        modal.remove();
    }

}


/* ---------- 9. SAVE NEW CUSTOMER ---------- */

function saveCustomer(event) {

    event.preventDefault();

    const name = document
        .getElementById("customerName")
        .value.trim();

    const email = document
        .getElementById("customerEmail")
        .value.trim();

    const phone = document
        .getElementById("customerPhone")
        .value.trim();

    const status = document
        .getElementById("customerStatus")
        .value;


    // Validate name
    if (name.length < 2) {

        alert("Please enter a valid customer name.");

        return;
    }


    // Validate email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {

        alert("Please enter a valid email address.");

        return;
    }


    // Validate phone
    if (!/^[+0-9()\-\s]{7,20}$/.test(phone)) {

        alert("Please enter a valid phone number.");

        return;
    }


    // Check duplicate email
    const emailExists = customers.some(customer =>

        customer.email.toLowerCase() === email.toLowerCase()

    );

    if (emailExists) {

        alert("A customer with this email already exists.");

        return;
    }


    // Create customer object
    const newCustomer = {

        name: name,
        email: email,
        phone: phone,
        status: status

    };


    // Add customer
    customers.push(newCustomer);


    // Refresh table
    renderCustomers();


    // Close modal
    closeCustomerModal();


    // Confirmation
    alert("Customer added successfully!");

}


/* ---------- 10. SEARCH CUSTOMERS ---------- */

function searchCustomers() {

    const searchValue = document
        .getElementById("customerSearch")
        .value
        .toLowerCase()
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


/* ---------- 11. OTHER PAGE PLACEHOLDERS ---------- */

function showPlaceholderPage(pageName) {

    mainContent.innerHTML = `

        <header class="topbar">

            <div class="search-box">

                <span>⌕</span>

                <input
                    type="text"
                    placeholder="Search ${pageName}..."
                >

            </div>

        </header>


        <section class="welcome-section">

            <div>

                <p class="eyebrow">WORKSPACE</p>

                <h1>${pageName}</h1>

                <p class="subtitle">
                    Manage your ${pageName.toLowerCase()} here.
                </p>

            </div>

        </section>


        <section class="content-card">

            <h3>${pageName} Management</h3>

            <p class="subtitle">
                This section will be developed next.
            </p>

        </section>


        <footer>
            © 2026 Brightloop Software
        </footer>

    `;

}


/* ---------- 12. INITIAL PAGE ---------- */

showPage("Dashboard");
