print("========================================")
print("     SUBSCRIPTION MANAGEMENT SYSTEM")
print("========================================")
invoices=[]
while True:

    print("\n----------- MENU -----------")
    print("1. Create Invoice")
    print("2. Record Payment")
    print("3. Revenue Report")
    print("4. Exit")
    print("----------------------------")

    choice = input("Enter your choice: ")

    if choice == "1":
        print("\nYou selected: Create Invoice")
        print("Invoice section will open here.")
        print("================================")
        print("       INVOICE CALCULATOR")
        print("================================")

        customer_name = input("Enter customer name: ")

        price = float(input("Enter price: ₹"))
        quantity = int(input("Enter quantity: "))

        # Calculate subtotal
        subtotal = price * quantity

        # Get discount
        discount = float(input("Enter discount: ₹"))

        # Calculate amount after discount
        amount_after_discount = subtotal - discount

        # Get tax percentage
        tax_rate = float(input("Enter tax percentage: "))

        # Calculate tax
        tax = amount_after_discount * tax_rate / 100

        # Calculate final amount
        final_amount = amount_after_discount + tax
        invoice_number = "INV" + str(len(invoices) + 1).zfill(3)

        invoice_amount = final_amount

        invoices.append({
            "invoice_number": invoice_number,
            "customer": customer_name,
            "amount": invoice_amount
        })
        
        print("\n================================")
        print("             INVOICE")
        print("================================")
        print("Invoice Number:",invoice_number)
        print("Customer:", customer_name)
        print("Price: ₹", price)
        print("Quantity:", quantity)
        print("Subtotal: ₹", subtotal)
        print("Discount: ₹", discount)
        print("Amount after discount: ₹", amount_after_discount)
        print("Tax:", tax_rate, "%")
        print("Tax amount: ₹", tax)
        print("Final Amount: ₹", final_amount)
        print("--------------------------------")



    elif choice == "2":
        print("\nAvailable Invoices:")

        for i, invoice in enumerate(invoices):
            print(i + 1, ".", invoice["invoice_number"], "-", invoice["customer"])

        invoice_choice = int(input("Enter invoice number to pay: "))

        selected_invoice = invoices[invoice_choice - 1]
        print("Payment section will open here.")
        # Get invoice status
        status = input("Enter invoice status (Draft/Confirmed/Paid): ")

        # ---------------- PAYMENT ----------------

        payment_method = input("Enter payment method (UPI/Card/Cash): ")
        payment_amount = float(input("Enter payment amount: ₹"))
        payment_date = input("Enter payment date (DD-MM-YYYY): ")
        payment_note = input("Enter payment note: ")

        # Calculate outstanding amount#changing to invoice amount
        outstanding = selected_invoice["amount"] - payment_amount
        selected_invoice["payment"] = payment_amount
        selected_invoice["payment_method"] = payment_method
        selected_invoice["payment_date"] = payment_date
        selected_invoice["payment_note"] = payment_note
        selected_invoice["outstanding"] = outstanding
                # Determine payment status
        if outstanding <= 0:
            payment_status = "Paid"
            outstanding = 0
        else:
            payment_status = "Outstanding"
        print("Invoice Status:", status)

        print("Payment Method:", payment_method)
        print("Payment Amount: ₹", payment_amount)
        print("Payment Date:", payment_date)
        print("Payment Note:", payment_note)
        print("Payment Status:", payment_status)
        print("Outstanding Amount: ₹", outstanding)

        print("================================")
            

    elif choice == "3":
        print("\nYou selected: Revenue Report")
        print("Revenue report will open here.")
        # Get number of invoices#hiding for i in range
        print("\n================================")
        print("        REVENUE REPORT")
        print("================================")

        total_revenue = 0
        total_payments = 0
        total_outstanding = 0

        for invoice in invoices:

            total_revenue = total_revenue + invoice["amount"]

            if "payment" in invoice:
                total_payments = total_payments + invoice["payment"]

            if "outstanding" in invoice:
                total_outstanding = total_outstanding + invoice["outstanding"]

        print("Total Revenue: ₹", total_revenue)
        print("Total Payments Received: ₹", total_payments)
        print("Total Outstanding: ₹", total_outstanding)

        print("================================")

        
        print("\n================================")
        print("       OVERDUE INVOICE REPORT")
        print("================================")

        number_of_overdue = int(input("Enter number of overdue invoices: "))

        total_overdue = 0

        for i in range(number_of_overdue):
            print("\nOverdue Invoice", i + 1)

            invoice_number = input("Enter invoice number: ")
            customer_name = input("Enter customer name: ")
            outstanding_amount = float(input("Enter outstanding amount: ₹"))

            total_overdue = total_overdue + outstanding_amount

            print("Invoice:", invoice_number)
            print("Customer:", customer_name)
            print("Outstanding: ₹", outstanding_amount)

        print("\n================================")
        print("       OVERDUE SUMMARY")
        print("================================")

        print("Number of overdue invoices:", number_of_overdue)
        print("Total overdue amount: ₹", total_overdue)

        print("================================")
            

    elif choice == "4":
        
        print("\nThank you for using the system!")
        break

    else:
        print("\nInvalid choice. Please try again.")
