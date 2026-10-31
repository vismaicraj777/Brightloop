
#include <iostream>
#include <string>
#include <cctype>
using namespace std;

struct user
{
    string name;
    string email;
    string password;
    string role;
};

// Temporary storage
user users[100];
int userCount = 0;

// Email validation
bool checkEmail(string email)
{
    size_t atPosition = email.find('@');

    if (atPosition == string::npos)
        return false;

    size_t dotPosition = email.find('.', atPosition);

    if (dotPosition == string::npos)
        return false;

    if (email.find(' ') != string::npos)
        return false;

    if (atPosition == 0 ||
        dotPosition == atPosition + 1 ||
        dotPosition == email.length() - 1)
        return false;

    return true;
}

// Password validation
bool checkPassword(string password)
{
    bool upper = false;
    bool lower = false;
    bool special = false;

    for (int i = 0; i < password.length(); i++)
    {
        char ch = password[i];

        if (isupper((unsigned char)ch))
            upper = true;

        if (islower((unsigned char)ch))
            lower = true;

        if (ispunct((unsigned char)ch))
            special = true;
    }

    return password.length() > 8 &&
           upper && lower && special;
}

// Check duplicate email
bool emailExists(string email)
{
    for (int i = 0; i < userCount; i++)
    {
        if (users[i].email == email)
            return true;
    }

    return false;
}

// Collect and validate user details
bool collectUserDetails(user &newUser)
{
    cout << "Enter name: ";
    cin >> newUser.name;

    bool emailValid = false;

    do
    {
        cout << "Enter email: ";
        cin >> newUser.email;

        if (!checkEmail(newUser.email))
        {
            cout << "Invalid email format!\n";
        }
        else if (emailExists(newUser.email))
        {
            cout << "Email already registered!\n";
        }
        else
        {
            emailValid = true;
            cout << "Email accepted!\n";
        }

    } while (!emailValid);

    bool passwordValid = false;

    do
    {
        cout << "Create password: ";
        cin >> newUser.password;

        if (checkPassword(newUser.password))
        {
            passwordValid = true;
            cout << "Password accepted!\n";
        }
        else
        {
            cout << "Invalid password!\n";
            cout << "Requirements:\n";
            cout << "- More than 8 characters\n";
            cout << "- One uppercase letter\n";
            cout << "- One lowercase letter\n";
            cout << "- One special character\n";
        }

    } while (!passwordValid);

    return true;
}

// Customer registration
void registerUser()
{
    if (userCount >= 100)
    {
        cout << "User storage is full!\n";
        return;
    }

    user newUser;

    cout << "\n===== CUSTOMER REGISTRATION =====\n";

    collectUserDetails(newUser);

    // Public registration always creates Customer
    newUser.role = "Customer";

    users[userCount] = newUser;
    userCount++;

    cout << "\nRegistration successful!\n";
    cout << "Welcome, " << newUser.name << "!\n";
}

// Login
int loginUser()
{
    string email, password;

    cout << "\n===== LOGIN =====\n";

    cout << "Enter email: ";
    cin >> email;

    cout << "Enter password: ";
    cin >> password;

    for (int i = 0; i < userCount; i++)
    {
        if (users[i].email == email &&
            users[i].password == password)
        {
            cout << "\nLogin successful!\n";
            cout << "Welcome back, " << users[i].name << "!\n";
            cout << "Role: " << users[i].role << "\n";

            return i;
        }
    }

    cout << "\nInvalid email or password!\n";
    return -1;
}

// Admin creates Staff account
void createStaff()
{
    if (userCount >= 100)
    {
        cout << "User storage is full!\n";
        return;
    }

    user newStaff;

    cout << "\n===== CREATE STAFF ACCOUNT =====\n";

    collectUserDetails(newStaff);

    newStaff.role = "Staff";

    users[userCount] = newStaff;
    userCount++;

    cout << "\nStaff account created successfully!\n";
}

// Admin views registered users
void viewUsers()
{
    cout << "\n===== REGISTERED USERS =====\n";

    for (int i = 0; i < userCount; i++)
    {
        cout << "\nName: " << users[i].name;
        cout << "\nEmail: " << users[i].email;
        cout << "\nRole: " << users[i].role << "\n";
    }
}

// Password reset
void resetPassword()
{
    string email, name, newPassword;

    cout << "\n===== PASSWORD RESET =====\n";

    cout << "Enter registered email: ";
    cin >> email;

    int index = -1;

    for (int i = 0; i < userCount; i++)
    {
        if (users[i].email == email)
        {
            index = i;
            break;
        }
    }

    if (index == -1)
    {
        cout << "Email not found!\n";
        return;
    }

    // Basic identity check for this prototype only
    cout << "Enter your registered name: ";
    cin >> name;

    if (users[index].name != name)
    {
        cout << "Identity verification failed!\n";
        return;
    }

    bool valid = false;

    do
    {
        cout << "Enter new password: ";
        cin >> newPassword;

        if (checkPassword(newPassword))
        {
            valid = true;
        }
        else
        {
            cout << "Password does not meet requirements!\n";
        }

    } while (!valid);

    users[index].password = newPassword;

    cout << "\nPassword updated successfully!\n";
}

// Admin menu
void adminMenu()
{
    int choice;

    do
    {
        cout << "\n===== ADMIN DASHBOARD =====\n";
        cout << "1. Create Staff Account\n";
        cout << "2. View All Users\n";
        cout << "3. Logout\n";

        cout << "Enter choice: ";
        cin >> choice;

        switch (choice)
        {
            case 1:
                createStaff();
                break;

            case 2:
                viewUsers();
                break;

            case 3:
                cout << "Admin logged out.\n";
                break;

            default:
                cout << "Invalid choice!\n";
        }

    } while (choice != 3);
}

// Staff menu
void staffMenu()
{
    int choice;

    do
    {
        cout << "\n===== STAFF DASHBOARD =====\n";
        cout << "1. View Staff Welcome Message\n";
        cout << "2. Logout\n";

        cout << "Enter choice: ";
        cin >> choice;

        switch (choice)
        {
            case 1:
                cout << "Welcome to the Staff Dashboard!\n";
                break;

            case 2:
                cout << "Staff logged out.\n";
                break;

            default:
                cout << "Invalid choice!\n";
        }

    } while (choice != 2);
}

// Customer menu
void customerMenu()
{
    int choice;

    do
    {
        cout << "\n===== CUSTOMER DASHBOARD =====\n";
        cout << "1. View Customer Welcome Message\n";
        cout << "2. Logout\n";

        cout << "Enter choice: ";
        cin >> choice;

        switch (choice)
        {
            case 1:
                cout << "Welcome to SubscriptIQ!\n";
                break;

            case 2:
                cout << "Customer logged out.\n";
                break;

            default:
                cout << "Invalid choice!\n";
        }

    } while (choice != 2);
}

// Main function
int main()
{
    int choice;

    // Create one initial Admin account for testing
    users[userCount].name = "Admin";
    users[userCount].email = "admin@subscriptiq.com";
    users[userCount].password = "Admin@12345";
    users[userCount].role = "Admin";
    userCount++;

    do
    {
        cout << "\n========== SUBSCRIPT IQ ==========\n";
        cout << "1. Register\n";
        cout << "2. Login\n";
        cout << "3. Forgot Password\n";
        cout << "4. Exit\n";

        cout << "Enter choice: ";
        cin >> choice;

        switch (choice)
        {
            case 1:
                registerUser();
                break;

            case 2:
            {
                int index = loginUser();

                if (index != -1)
                {
                    if (users[index].role == "Admin")
                    {
                        adminMenu();
                    }
                    else if (users[index].role == "Staff")
                    {
                        staffMenu();
                    }
                    else if (users[index].role == "Customer")
                    {
                        customerMenu();
                    }
                }

                break;
            }

            case 3:
                resetPassword();
                break;

            case 4:
                cout << "Thank you for using SubscriptIQ!\n";
                break;

            default:
                cout << "Invalid choice!\n";
        }

    } while (choice != 4);

    return 0;
}
