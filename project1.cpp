
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

// Temporary user storage
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

    if (atPosition == 0 || dotPosition == atPosition + 1 ||
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

        if (isupper(ch))
            upper = true;
        else if (islower(ch))
            lower = true;
        else if (ispunct(ch))
            special = true;
    }

    return password.length() > 8 &&
           upper && lower && special;
}

// Check whether email already exists
bool emailExists(string email)
{
    for (int i = 0; i < userCount; i++)
    {
        if (users[i].email == email)
            return true;
    }

    return false;
}

// Registration
void registerUser()
{
    if (userCount >= 100)
    {
        cout << "User storage is full!\n";
        return;
    }

    user newUser;

    cout << "\n===== USER REGISTRATION =====\n";

    cout << "Enter your name: ";
    cin >> newUser.name;

    newUser.role = "Customer";

    bool emailValid = false;

    do
    {
        cout << "Enter your email: ";
        cin >> newUser.email;

        if (!checkEmail(newUser.email))
        {
            cout << "Invalid email format. Try again.\n";
        }
        else if (emailExists(newUser.email))
        {
            cout << "Email already registered. Try another.\n";
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
        cout << "Create your password: ";
        cin >> newUser.password;

        if (checkPassword(newUser.password))
        {
            passwordValid = true;
            cout << "Password accepted!\n";
        }
        else
        {
            cout << "Password invalid. Try again.\n";
            cout << "Requirements: More than 8 characters, "
                 << "uppercase, lowercase and special character.\n";
        }

    } while (!passwordValid);

    // Store user temporarily
    users[userCount] = newUser;
    userCount++;

    cout << "\nRegistration successful!\n";
    cout << "Welcome, " << newUser.name << "!\n";
}

// Login
void loginUser()
{
    string email, password;

    cout << "\n===== USER LOGIN =====\n";

    cout << "Enter your email: ";
    cin >> email;

    cout << "Enter your password: ";
    cin >> password;

    for (int i = 0; i < userCount; i++)
    {
        if (users[i].email == email &&
            users[i].password == password)
        {
            cout << "\nLogin successful!\n";
            cout << "Welcome back, " << users[i].name << "!\n";
            cout << "Role: " << users[i].role << endl;
            return;
        }
    }

    cout << "\nInvalid email or password.\n";
}

// Main menu
int main()
{
    int choice;

    do
    {
        cout << "\n===== SUBSCRIPT IQ =====\n";
        cout << "1. Register\n";
        cout << "2. Login\n";
        cout << "3. Exit\n";

        cout << "Enter your choice: ";
        cin >> choice;

        switch (choice)
        {
            case 1:
                registerUser();
                break;

            case 2:
                loginUser();
                break;

            case 3:
                cout << "Thank you for using SubscriptIQ!\n";
                break;

            default:
                cout << "Invalid choice. Try again.\n";
        }

    } while (choice != 3);

    return 0;
}

