#include <iostream>
#include <string>
using namespace std;
struct user
{
    string name;
    string email;
    string password;
    string role;
};
int main()
{
    user user1;
    cout<<"Enter your name:";
    cin>>user1.name;
    cout<<"Enter your email:";
    cin>>user1.email;
    cout<<"enter your role:";
    cin>>user1.role;
      cout<<"Enter your password:";
    cin>>user1.password;
}
