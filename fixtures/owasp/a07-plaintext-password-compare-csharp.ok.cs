using System.Security.Cryptography;
using System.Text;

class LoginController
{
    public bool Authenticate(User user, string inputPassword)
    {
        byte[] computedHash = HashPassword(inputPassword, user.Salt);
        return CryptographicOperations.FixedTimeEquals(computedHash, user.PasswordHash);
    }

    private byte[] HashPassword(string password, byte[] salt)
    {
        using (var pbkdf2 = new Rfc2898DeriveBytes(Encoding.UTF8.GetBytes(password), salt, 100000, HashAlgorithmName.SHA256))
        {
            return pbkdf2.GetBytes(32);
        }
    }
}

class User
{
    public byte[] PasswordHash { get; set; }
    public byte[] Salt { get; set; }
}
