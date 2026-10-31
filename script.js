
/* ==========================================
   BRIGHTLOOP - SUBSCRIPTION MANAGEMENT SYSTEM
========================================== */


/* ---------- 1. INITIAL SETUP ---------- */

const navLinks = document.querySelectorAll(".nav-link");
const mainContent = document.querySelector(".main-content");

// Save the original dashboard
const dashboardHTML = mainContent.innerHTML;


/* ---------- 2. CUSTOMER DATA ---------- */

let customers = JSON.parse(localStorage.getItem("brightloopCustomers")) || [
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


/* SAVE CUSTOMER DATA */

function saveCustomersToStorage() {
    localStorage.setItem(
        "brightloopCustomers",
        JSON.stringify(customers)
    );
}


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

    // Handle Edit and Delete button clicks
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


/* ---------- 6. RENDER CUSTOMER TABLE ---------- */

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

        // Find the customer's original position in the array
        const index = customers.indexOf(customer);

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

        const actionsCell = document.createElement("td");

        actionsCell.innerHTML = `
            <button
                type="button"
                class="customer-action-btn edit-btn"
                data-index="${index}"
            >
                Edit
            </button>

            <button
                type="button"
                class="customer-action-btn delete-btn"
                data-index="${index}"
            >
                Delete
            </button>
        `;

        row.append(
            nameCell,
            emailCell,
            phoneCell,
            statusCell,
            actionsCell
        );

        tableBody.appendChild(row);

    });

}


/* ---------- 7. OPEN CUSTOMER MODAL ---------- */

function openCustomerModal(customerIndex = null) {

    // Prevent multiple modals
    if (document.getElementById("customerModal")) return;

    const isEditing = customerIndex !== null;

    const customer = isEditing
        ? customers[customerIndex]
        : null;

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
                            ? "Update the customer's information."
                            : "Enter the details of your new customer."
                        }
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
                        ${isEditing ? "Update Customer" : "Save Customer"}
                    </button>

                </div>

            </form>

        </div>

    `;

    document.body.appendChild(modal);


    // Fill existing details when editing
    if (isEditing) {

        document.getElementById("customerName").value = customer.name;

        document.getElementById("customerEmail").value = customer.email;

        document.getElementById("customerPhone").value = customer.phone;

        document.getElementById("customerStatus").value = customer.status;

    }


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
        .addEventListener("submit", function(event) {

            saveCustomer(event, customerIndex);

        });


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


/* ---------- 9. SAVE OR UPDATE CUSTOMER ---------- */

function saveCustomer(event, customerIndex = null) {

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


    // Check duplicate email, excluding the customer being edited
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


    // Create customer object
    const customerData = {

        name: name,
        email: email,
        phone: phone,
        status: status

    };


    if (customerIndex !== null) {

        // Update existing customer
        customers[customerIndex] = customerData;

    } else {

        // Add new customer
        customers.push(customerData);

    }
    saveCustomersToStorage();


    // Close modal
    closeCustomerModal();


    // Refresh table while preserving search
    searchCustomers();


    // Confirmation
    alert(
        customerIndex !== null
            ? "Customer updated successfully!"
            : "Customer added successfully!"
    );

}


/* ---------- 10. DELETE CUSTOMER ---------- */

function deleteCustomer(index) {

    const customer = customers[index];

    if (!customer) return;

    const confirmDelete = confirm(
        `Are you sure you want to delete ${customer.name}?`
    );

    if (!confirmDelete) return;


    // Remove customer from array
    customers.splice(index, 1);
    saveCustomersToStorage();


    // Refresh table
    searchCustomers();


    alert("Customer deleted successfully!");

}


/* ---------- 11. SEARCH CUSTOMERS ---------- */

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


/* ---------- 12. OTHER PAGE PLACEHOLDERS ---------- */

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


/* ---------- 13. INITIAL PAGE ---------- */

showPage("Dashboard");
