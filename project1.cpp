#include <iostream>
#include <string>
#include <unordered_map>
#include <algorithm>
#include <cctype>
#include <random>
#include <chrono>
#include <limits>
#include <sstream>

using namespace std;
using Clock = chrono::steady_clock;

const size_t MAX_USERS = 100;
const int MAX_LOGIN_ATTEMPTS = 3;
const int LOCK_SECONDS = 60;
const int OTP_EXPIRY_SECONDS = 300;
const int MAX_OTP_ATTEMPTS = 3;

struct User {
    string name;
    string email;
    string password;
    string role;
    bool active = true;
    int failedLoginAttempts = 0;
    Clock::time_point lockedUntil{};
};

struct Session {
    bool authenticated = false;
    string email;
    string role;
};

struct OTPData {
    string code;
    Clock::time_point expiresAt;
    int attempts = 0;
};

unordered_map<string, OTPData> otpByEmail;
User users[MAX_USERS];
size_t userCount = 0;

string trim(const string& value) {
    size_t first = value.find_first_not_of(" \t\r\n");
    if (first == string::npos) return "";
    size_t last = value.find_last_not_of(" \t\r\n");
    return value.substr(first, last - first + 1);
}

bool readLine(const string& prompt, string& result) {
    cout << prompt;
    if (!getline(cin, result)) {
        cout << "\nInput ended. Exiting safely.\n";
        return false;
    }
    result = trim(result);
    return true;
}

bool readMenuChoice(const string& prompt, int& choice) {
    while (true) {
        string line;
        if (!readLine(prompt, line)) return false;

        stringstream ss(line);
        char extra;
        if ((ss >> choice) && !(ss >> extra) && choice >= 0) return true;
        cout << "Enter a valid non-negative whole number.\n";
    }
}

string normalizeEmail(string email) {
    transform(email.begin(), email.end(), email.begin(),
              [](unsigned char ch) { return static_cast<char>(tolower(ch)); });
    return email;
}

bool validEmail(const string& email) {
    if (email.empty() || email.find_first_of(" \t\r\n") != string::npos) return false;

    size_t at = email.find('@');
    if (at == string::npos || at == 0 || at != email.rfind('@')) return false;

    size_t dot = email.find('.', at + 2);
    if (dot == string::npos || dot == email.size() - 1) return false;
    if (email[at + 1] == '.' || email.back() == '.') return false;
    if (email.find("..") != string::npos) return false;
    return true;
}

bool validName(const string& name) {
    return !name.empty() && any_of(name.begin(), name.end(),
        [](unsigned char ch) { return !isspace(ch); });
}

bool validPassword(const string& password) {
    if (password.length() < 8) return false;

    bool upper = false, lower = false, digit = false, special = false;

    for (unsigned char ch : password) {
        if (isupper(ch)) upper = true;
        else if (islower(ch)) lower = true;
        else if (isdigit(ch)) digit = true;
        else if (!isspace(ch)) special = true;
    }

    return upper && lower && digit && special;
}

int findUserByEmail(const string& email) {
    const string target = normalizeEmail(email);

    for (size_t i = 0; i < userCount; ++i) {
        if (normalizeEmail(users[i].email) == target)
            return static_cast<int>(i);
    }

    return -1;
}

string generateOTP() {
    static random_device rd;
    static mt19937 gen(rd());
    uniform_int_distribution<int> dist(0, 999999);

    int value = dist(gen);
    string code = to_string(value);

    return string(6 - code.length(), '0') + code;
}

bool readSixDigitOTP(string& code) {
    while (true) {
        if (!readLine("Enter the 6-digit OTP: ", code)) return false;

        if (code.length() == 6 &&
            all_of(code.begin(), code.end(),
                   [](unsigned char ch) { return isdigit(ch); }))
            return true;

        cout << "OTP must contain exactly 6 digits.\n";
    }
}

bool sendDemoOTP(const string& email) {
    string code = generateOTP();

    otpByEmail[email] = {
        code,
        Clock::now() + chrono::seconds(OTP_EXPIRY_SECONDS),
        0
    };

    cout << "\n[DEMO ONLY] OTP for " << email << " is: " << code << "\n";
    cout << "It expires in 5 minutes.\n";

    return true;
}

bool verifyOTP(const string& email) {
    auto it = otpByEmail.find(email);

    if (it == otpByEmail.end()) {
        cout << "No active OTP. Request a new one.\n";
        return false;
    }

    while (it->second.attempts < MAX_OTP_ATTEMPTS) {
        if (Clock::now() > it->second.expiresAt) {
            cout << "OTP expired. Request a new one.\n";
            otpByEmail.erase(it);
            return false;
        }

        string entered;

        if (!readSixDigitOTP(entered)) return false;

        if (entered == it->second.code) {
            otpByEmail.erase(it);
            cout << "OTP verified.\n";
            return true;
        }

        ++it->second.attempts;

        cout << "Incorrect OTP. Attempts left: "
             << MAX_OTP_ATTEMPTS - it->second.attempts << "\n";
    }

    otpByEmail.erase(it);
    cout << "Too many incorrect OTP attempts. Request a new OTP.\n";

    return false;
}

bool registerCustomer() {
    if (userCount >= MAX_USERS) {
        cout << "User capacity reached.\n";
        return false;
    }

    string name, email, password;

    if (!readLine("Full name: ", name)) return false;

    if (!validName(name)) {
        cout << "Name cannot be empty or whitespace only.\n";
        return false;
    }

    if (!readLine("Email: ", email)) return false;

    email = normalizeEmail(email);

    if (!validEmail(email)) {
        cout << "Email format is invalid.\n";
        return false;
    }

    if (findUserByEmail(email) != -1) {
        cout << "An account with this email already exists.\n";
        return false;
    }

    if (!readLine("Password (8+ chars, upper/lower/digit/special): ", password))
        return false;

    if (!validPassword(password)) {
        cout << "Password does not meet the requirements.\n";
        return false;
    }

    users[userCount++] = {
        name, email, password, "Customer", true, 0, {}
    };

    cout << "Customer account created. You can now log in.\n";

    return true;
}

bool isLocked(const User& user) {
    return Clock::now() < user.lockedUntil;
}

Session login() {
    Session session;

    string email, password;

    if (!readLine("Email: ", email)) return session;

    email = normalizeEmail(email);

    if (!readLine("Password: ", password)) return session;

    int index = findUserByEmail(email);

    if (index == -1) {
        cout << "Invalid email or password.\n";
        return session;
    }

    User& user = users[index];

    if (!user.active) {
        cout << "This account is inactive.\n";
        return session;
    }

    if (isLocked(user)) {
        auto remaining = chrono::duration_cast<chrono::seconds>(
            user.lockedUntil - Clock::now()).count();

        cout << "Account temporarily locked. Try again in "
             << max(0L, remaining) << " seconds.\n";

        return session;
    }

    if (password != user.password) {
        ++user.failedLoginAttempts;

        cout << "Invalid email or password.\n";

        if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
            user.lockedUntil =
                Clock::now() + chrono::seconds(LOCK_SECONDS);

            user.failedLoginAttempts = 0;

            cout << "Too many failures. Account locked for 60 seconds.\n";
        }

        return session;
    }

    user.failedLoginAttempts = 0;
    user.lockedUntil = {};

    session = {true, user.email, user.role};

    cout << "Login successful. Role: " << session.role << "\n";

    return session;
}

bool isAdminSession(const Session& session) {
    if (!session.authenticated || session.role != "Admin") {
        cout << "Access denied. Admin login required.\n";
        return false;
    }

    int index = findUserByEmail(session.email);

    if (index == -1 ||
        !users[index].active ||
        users[index].role != "Admin") {

        cout << "Access denied. Admin account is unavailable.\n";
        return false;
    }

    return true;
}

void viewUsers(const Session& session) {
    if (!isAdminSession(session)) return;

    cout << "\n--- USER LIST ---\n";

    for (size_t i = 0; i < userCount; ++i) {
        cout << users[i].name << " | "
             << users[i].email << " | "
             << users[i].role << " | "
             << (users[i].active ? "Active" : "Inactive")
             << "\n";
    }
}

void searchUser(const Session& session) {
    if (!isAdminSession(session)) return;

    string email;

    if (!readLine("Email to search: ", email)) return;

    int index = findUserByEmail(email);

    if (index == -1) {
        cout << "User not found.\n";
        return;
    }

    const User& user = users[index];

    cout << "Name: " << user.name
         << "\nEmail: " << user.email
         << "\nRole: " << user.role
         << "\nStatus: "
         << (user.active ? "Active" : "Inactive") << "\n";
}

void createStaff(const Session& session) {
    if (!isAdminSession(session)) return;

    if (userCount >= MAX_USERS) {
        cout << "User capacity reached.\n";
        return;
    }

    string name, email, password;

    if (!readLine("Staff name: ", name)) return;

    if (!validName(name)) {
        cout << "Name cannot be empty or whitespace only.\n";
        return;
    }

    if (!readLine("Staff email: ", email)) return;

    email = normalizeEmail(email);

    if (!validEmail(email)) {
        cout << "Email format is invalid.\n";
        return;
    }

    if (findUserByEmail(email) != -1) {
        cout << "Email already exists.\n";
        return;
    }

    if (!readLine("Temporary password (8+ chars, upper/lower/digit/special): ",
                  password))
        return;

    if (!validPassword(password)) {
        cout << "Password does not meet the requirements.\n";
        return;
    }

    users[userCount++] = {
        name, email, password, "Staff", true, 0, {}
    };

    cout << "Staff account created.\n";
}

void resetPassword() {
    string email;

    if (!readLine("Account email: ", email)) return;

    email = normalizeEmail(email);

    int index = findUserByEmail(email);

    if (index == -1 || !users[index].active) {
        cout << "If the account exists, reset instructions would be sent.\n";
        return;
    }

    sendDemoOTP(email);

    if (!verifyOTP(email)) return;

    string newPassword;

    if (!readLine("New password: ", newPassword)) return;

    if (!validPassword(newPassword)) {
        cout << "Password does not meet the requirements.\n";
        return;
    }

    if (newPassword == users[index].password) {
        cout << "Choose a password different from the current password.\n";
        return;
    }

    users[index].password = newPassword;
    users[index].failedLoginAttempts = 0;
    users[index].lockedUntil = {};

    cout << "Password updated.\n";
}

void adminMenu(const Session& session) {
    int choice;

    do {
        cout << "\n--- ADMIN MENU ---\n"
             << "1. View users\n"
             << "2. Search user\n"
             << "3. Create staff\n"
             << "0. Logout\n";

        if (!readMenuChoice("Choice: ", choice)) return;

        switch (choice) {
            case 1:
                viewUsers(session);
                break;

            case 2:
                searchUser(session);
                break;

            case 3:
                createStaff(session);
                break;

            case 0:
                cout << "Logged out.\n";
                break;

            default:
                cout << "Invalid choice.\n";
        }

    } while (choice != 0);
}

void staffMenu(const Session& session) {
    int choice;

    do {
        cout << "\n--- STAFF MENU ---\n"
             << "1. View own account\n"
             << "0. Logout\n";

        if (!readMenuChoice("Choice: ", choice)) return;

        if (choice == 1) {
            int index = findUserByEmail(session.email);

            if (index != -1 && users[index].active) {
                cout << "Name: " << users[index].name
                     << "\nEmail: " << users[index].email
                     << "\nRole: Staff\n";
            }

        } else if (choice == 0) {
            cout << "Logged out.\n";

        } else {
            cout << "Invalid choice.\n";
        }

    } while (choice != 0);
}

void customerMenu(const Session& session) {
    int choice;

    do {
        cout << "\n--- CUSTOMER MENU ---\n"
             << "1. View own account\n"
             << "0. Logout\n";

        if (!readMenuChoice("Choice: ", choice)) return;

        if (choice == 1) {
            int index = findUserByEmail(session.email);

            if (index != -1 && users[index].active) {
                cout << "Name: " << users[index].name
                     << "\nEmail: " << users[index].email
                     << "\nRole: Customer\n";
            }

        } else if (choice == 0) {
            cout << "Logged out.\n";

        } else {
            cout << "Invalid choice.\n";
        }

    } while (choice != 0);
}

int main() {
    users[userCount++] = {
        "SubscriptIQ Admin",
        "admin@subscriptiq.com",
        "Admin@12345",
        "Admin",
        true,
        0,
        {}
    };

    cout << "====================================\n"
         << "       SUBSCRIPTIQ AUTH DEMO\n"
         << "====================================\n"
         << "Test admin email: admin@subscriptiq.com\n"
         << "Test admin password: Admin@12345\n"
         << "These credentials are hardcoded for demonstration only.\n";

    while (true) {
        int choice;

        cout << "\n--- MAIN MENU ---\n"
             << "1. Register as customer\n"
             << "2. Login\n"
             << "3. Reset password\n"
             << "0. Exit\n";

        if (!readMenuChoice("Choice: ", choice)) break;

        if (choice == 0) {
            cout << "Goodbye.\n";
            break;

        } else if (choice == 1) {
            registerCustomer();

        } else if (choice == 2) {
            Session session = login();

            if (session.authenticated) {
                if (session.role == "Admin")
                    adminMenu(session);

                else if (session.role == "Staff")
                    staffMenu(session);

                else if (session.role == "Customer")
                    customerMenu(session);

                else
                    cout << "Unknown role. Access denied.\n";
            }

        } else if (choice == 3) {
            resetPassword();

        } else {
            cout << "Invalid choice.\n";
        }
    }

    return 0;
}