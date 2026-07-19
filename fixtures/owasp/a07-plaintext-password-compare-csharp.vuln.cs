class LoginController
{
    public bool Authenticate(User user, string inputPassword)
    {
        if (user.Password == inputPassword)
        {
            return true;
        }
        return false;
    }
}

class User
{
    public string Password { get; set; }
}
