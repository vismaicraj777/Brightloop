#include <iostream>
#include <string>
#include <cctype>
#include <random>
#include <ctime>
#include <limits>
#include <chrono>

using namespace std;

// ================= USER STRUCTURE =================

struct user
{
    string name;
    string email;
    string password;
    string role;
    bool isActive;

    int failedLoginAttempts = 0;
    chrono::steady_clock::time_point lockedUntil{};
};

// ================= TEMPORARY STORAGE =================

const int MAX_USERS = 100;
user users[MAX_USERS];
int userCount = 0;

// OTP information
struct OTPData
{
    int code;
    int userIndex;
    int attempts;
    chrono::steady_clock::time_point expiry;
    bool active;
};

OTPData currentOTP = {0, -1, 0, {}, false};

// ================= INPUT FUNCTIONS =================

// Read a complete line, including spaces
string readText(string message)
{
    string value;

    cout << message;
    getline(cin, value);

    return value;
}

// Read an integer safely
int readChoice(string message)
{
    int choice;

    while (true)
    {
        cout << message;

        if (cin >> choice)
        {
            cin.ignore(numeric_limits<streamsize>::max(), '\n');
            return choice;
        }

        cout << "Please enter a valid number!\n";

        cin.clear();
        cin.ignore(numeric_limits<streamsize>::max(), '\n');
    }
}

// ================= OTP GENERATION =================

int generateOTP()
{
    static random_device rd;
    static mt19937 generator(rd());

    uniform_int_distribution<int> distribution(100000, 999999);

    return distribution(generator);
}

// ================= EMAIL VALIDATION =================

bool checkEmail(string email)
{
    size_t atPosition = email.find('@');

    if (atPosition == string::npos)
        return false;

    if (atPosition == 0)
        return false;

    if (email.find('@', atPosition + 1) != string::npos)
        return false;

    size_t dotPosition = email.find('.', atPosition + 1);

    if (dotPosition == string::npos)
        return false;

    if (dotPosition == atPosition + 1)
        return false;

    if (dotPosition == email.length() - 1)
        return false;

    if (email.find(' ') != string::npos)
        return false;

    if (email.find("..") != string::npos)
        return false;

    return true;
}

// ================= PASSWORD VALIDATION =================

bool checkPassword(string password)
{
    bool upper = false;
    bool lower = false;
    bool special = false;

    for (char ch : password)
    {
        unsigned char c = static_cast<unsigned char>(ch);

        if (isupper(c))
            upper = true;

        if (islower(c))
            lower = true;

        if (ispunct(c))
            special = true;
    }

    return password.length() > 8 &&
           upper && lower && special;
}

// ================= DUPLICATE EMAIL CHECK =================

bool emailExists(string email)
{
    for (int i = 0; i < userCount; i++)
    {
        if (users[i].email == email)
            return true;
    }

    return false;
}

// ================= COLLECT USER DETAILS =================

bool collectUserDetails(user &newUser)
{
    newUser.name = readText("Enter full name: ");

    if (newUser.name.empty())
    {
        cout << "Name cannot be empty!\n";
        return false;
    }

    bool emailValid = false;

    do
    {
        newUser.email = readText("Enter email: ");

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
        newUser.password = readText("Create password: ");

        if (checkPassword(newUser.password))
        {
            passwordValid = true;
            cout << "Password accepted!\n";
        }
        else
        {
            cout << "\nInvalid password!\n";
            cout << "Requirements:\n";
            cout << "- More than 8 characters\n";
            cout << "- One uppercase letter\n";
            cout << "- One lowercase letter\n";
            cout << "- One special character\n";
        }

    } while (!passwordValid);

    return true;
}

// ================= CUSTOMER REGISTRATION =================

void registerUser()
{
    if (userCount >= MAX_USERS)
    {
        cout << "User storage is full!\n";
        return;
    }

    user newUser;

    cout << "\n===== CUSTOMER REGISTRATION =====\n";

    if (!collectUserDetails(newUser))
        return;

    newUser.role = "Customer";
    newUser.isActive = true;
    newUser.failedLoginAttempts = 0;

    users[userCount] = newUser;
    userCount++;

    cout << "\nRegistration successful!\n";
    cout << "Welcome, " << newUser.name << "!\n";
}

// ================= LOGIN =================

// One login attempt per function call.
// Failed attempts are retained in the user record.
int loginUser()
{
    cout << "\n===== LOGIN =====\n";

    string email = readText("Enter email: ");

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
        cout << "Invalid email or password!\n";
        return -1;
    }

    if (!users[index].isActive)
    {
        cout << "This account is inactive!\n";
        return -1;
    }

    auto now = chrono::steady_clock::now();

    if (now < users[index].lockedUntil)
    {
        auto remaining = chrono::duration_cast<chrono::seconds>(
            users[index].lockedUntil - now
        ).count();

        cout << "Account temporarily locked.\n";
        cout << "Try again in " << remaining << " seconds.\n";

        return -1;
    }

    string password = readText("Enter password: ");

    if (users[index].password == password)
    {
        users[index].failedLoginAttempts = 0;

        cout << "\nLogin successful!\n";
        cout << "Welcome back, " << users[index].name << "!\n";
        cout << "Role: " << users[index].role << "\n";

        return index;
    }

    users[index].failedLoginAttempts++;

    cout << "\nInvalid email or password!\n";

    if (users[index].failedLoginAttempts >= 3)
    {
        users[index].lockedUntil =
            chrono::steady_clock::now() + chrono::seconds(60);

        users[index].failedLoginAttempts = 0;

        cout << "Too many failed attempts!\n";
        cout << "Account locked for 60 seconds.\n";
    }
    else
    {
        cout << "Attempts remaining: "
             << 3 - users[index].failedLoginAttempts << "\n";
    }

    return -1;
}

// ================= ADMIN AUTHORIZATION =================

// Admin access is checked inside this function.
void createStaff(int adminIndex)
{
    if (adminIndex < 0 || adminIndex >= userCount ||
        users[adminIndex].role != "Admin" ||
        !users[adminIndex].isActive)
    {
        cout << "Access denied! Admin authorization required.\n";
        return;
    }

    if (userCount >= MAX_USERS)
    {
        cout << "User storage is full!\n";
        return;
    }

    user newStaff;

    cout << "\n===== CREATE STAFF ACCOUNT =====\n";

    if (!collectUserDetails(newStaff))
        return;

    newStaff.role = "Staff";
    newStaff.isActive = true;
    newStaff.failedLoginAttempts = 0;

    users[userCount] = newStaff;
    userCount++;

    cout << "\nStaff account created successfully!\n";
}

// ================= VIEW USERS =================

void viewUsers()
{
    cout << "\n===== REGISTERED USERS =====\n";

    for (int i = 0; i < userCount; i++)
    {
        cout << "\nName: " << users[i].name;
        cout << "\nEmail: " << users[i].email;
        cout << "\nRole: " << users[i].role;

        cout << "\nStatus: "
             << (users[i].isActive ? "Active" : "Inactive");

        cout << "\n-------------------------\n";
    }
}

// ================= SEARCH USER =================

void searchUser()
{
    string email = readText("Enter user email: ");

    for (int i = 0; i < userCount; i++)
    {
        if (users[i].email == email)
        {
            cout << "\nUser found!\n";
            cout << "Name: " << users[i].name << "\n";
            cout << "Email: " << users[i].email << "\n";
            cout << "Role: " << users[i].role << "\n";
            cout << "Status: "
                 << (users[i].isActive ? "Active" : "Inactive")
                 << "\n";

            return;
        }
    }

    cout << "User not found!\n";
}

// ================= ACCOUNT MANAGEMENT =================

void manageAccount(int adminIndex)
{
    if (adminIndex < 0 || adminIndex >= userCount ||
        users[adminIndex].role != "Admin" ||
        !users[adminIndex].isActive)
    {
        cout << "Access denied!\n";
        return;
    }

    string email = readText("Enter user email: ");

    for (int i = 0; i < userCount; i++)
    {
        if (users[i].email == email)
        {
            if (users[i].role == "Admin")
            {
                cout << "Admin account cannot be changed here.\n";
                return;
            }

            cout << "\nName: " << users[i].name;
            cout << "\nCurrent status: "
                 << (users[i].isActive ? "Active" : "Inactive");

            cout << "\n1. Activate account";
            cout << "\n2. Deactivate account\n";

            int choice = readChoice("Enter choice: ");

            if (choice == 1)
            {
                users[i].isActive = true;
                cout << "Account activated!\n";
            }
            else if (choice == 2)
            {
                users[i].isActive = false;
                cout << "Account deactivated!\n";
            }
            else
            {
                cout << "Invalid choice!\n";
            }

            return;
        }
    }

    cout << "User not found!\n";
}

// ================= OTP SENDING (DEMO) =================

// Replace this function with a real email provider integration later.
void sendOTP(int otp, string email)
{
    cout << "\n[DEMO ONLY] OTP for " << email
         << " is: " << otp << "\n";

    cout << "This OTP is not being emailed.\n";
}

// ================= PASSWORD RESET =================

void resetPassword()
{
    cout << "\n===== PASSWORD RESET =====\n";

    string email = readText("Enter registered email: ");

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

    if (!users[index].isActive)
    {
        cout << "This account is inactive!\n";
        return;
    }

    currentOTP.code = generateOTP();
    currentOTP.userIndex = index;
    currentOTP.attempts = 0;
    currentOTP.expiry =
        chrono::steady_clock::now() + chrono::minutes(5);
    currentOTP.active = true;

    sendOTP(currentOTP.code, email);

    int enteredOTP;

    while (currentOTP.attempts < 3)
    {
        if (chrono::steady_clock::now() >= currentOTP.expiry)
        {
            cout << "OTP expired! Request a new OTP.\n";
            currentOTP.active = false;
            return;
        }

        int value = readChoice("Enter OTP: ");

        enteredOTP = value;

        if (enteredOTP == currentOTP.code &&
            currentOTP.userIndex == index)
        {
            cout << "\nOTP verified successfully!\n";
            currentOTP.active = false;
            break;
        }

        currentOTP.attempts++;

        cout << "Incorrect OTP!\n";

        if (currentOTP.attempts < 3)
        {
            cout << "Attempts remaining: "
                 << 3 - currentOTP.attempts << "\n";
        }
    }

    if (currentOTP.active)
    {
        cout << "Maximum OTP attempts reached!\n";
        currentOTP.active = false;
        return;
    }

    string newPassword;

    while (true)
    {
        newPassword = readText("Enter new password: ");

        if (!checkPassword(newPassword))
        {
            cout << "Password does not meet requirements!\n";
        }
        else if (newPassword == users[index].password)
        {
            cout << "You cannot reuse your current password!\n";
        }
        else
        {
            break;
        }
    }

    users[index].password = newPassword;

    cout << "\nPassword updated successfully!\n";
}

// ================= ADMIN MENU =================

void adminMenu(int adminIndex)
{
    int choice;

    do
    {
        cout << "\n===== ADMIN MENU =====\n";
        cout << "1. Create Staff Account\n";
        cout << "2. View All Users\n";
        cout << "3. Search User\n";
        cout << "4. Manage User Account\n";
        cout << "5. Logout\n";

        choice = readChoice("Enter choice: ");

        switch (choice)
        {
            case 1:
                createStaff(adminIndex);
                break;

            case 2:
                viewUsers();
                break;

            case 3:
                searchUser();
                break;

            case 4:
                manageAccount(adminIndex);
                break;

            case 5:
                cout << "Admin logged out.\n";
                break;

            default:
                cout << "Invalid choice!\n";
        }

    } while (choice != 5);
}

// ================= STAFF MENU =================

void staffMenu()
{
    cout << "\nStaff authenticated successfully.\n";
    cout << "Staff dashboard will be handled by frontend.\n";
}

// ================= CUSTOMER MENU =================

void customerMenu()
{
    cout << "\nCustomer authenticated successfully.\n";
    cout << "Customer dashboard will be handled by frontend.\n";
}

// ================= MAIN =================

int main()
{
    // Test Admin account
    users[0].name = "Admin";
    users[0].email = "admin@subscriptiq.com";
    users[0].password = "Admin@12345";
    users[0].role = "Admin";
    users[0].isActive = true;

    userCount = 1;

    int choice;

    do
    {
        cout << "\n===== SUBSCRIPT IQ =====\n";
        cout << "1. Register\n";
        cout << "2. Login\n";
        cout << "3. Forgot Password\n";
        cout << "4. Exit\n";

        choice = readChoice("Enter choice: ");

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
                        adminMenu(index);
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
                cout << "\nThank you for using SubscriptIQ!\n";
                break;

            default:
                cout << "Invalid choice!\n";
        }

    } while (choice != 4);

    return 0;
}