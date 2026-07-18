using System.Security.Cryptography;

class PasswordHasher
{
    public byte[] Hash(byte[] password)
    {
        using (var sha = SHA256.Create())
        {
            return sha.ComputeHash(password);
        }
    }
}
