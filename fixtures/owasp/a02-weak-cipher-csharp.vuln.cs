using System.Security.Cryptography;

class LegacyEncryptor
{
    public void Encrypt()
    {
        var des = new DESCryptoServiceProvider();
        des.Key = new byte[8];
        des.IV = new byte[8];
    }
}
