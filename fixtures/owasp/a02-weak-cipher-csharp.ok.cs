using System.Security.Cryptography;

class ModernEncryptor
{
    public void Encrypt()
    {
        var aes = new AesCryptoServiceProvider();
        aes.Mode = CipherMode.CBC;
        aes.GenerateIV();
        aes.GenerateKey();
    }
}
