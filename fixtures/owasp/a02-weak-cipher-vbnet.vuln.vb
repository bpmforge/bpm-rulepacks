Imports System.Security.Cryptography

Public Class Encryptor
    Public Function Encrypt(data As Byte()) As Byte()
        Dim des As New DESCryptoServiceProvider()
        Return des.CreateEncryptor().TransformFinalBlock(data, 0, data.Length)
    End Function
End Class
