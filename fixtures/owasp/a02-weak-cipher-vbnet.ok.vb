Imports System.Security.Cryptography

Public Class Encryptor
    Public Function Encrypt(data As Byte()) As Byte()
        Dim aes As New AesCryptoServiceProvider()
        Return aes.CreateEncryptor().TransformFinalBlock(data, 0, data.Length)
    End Function
End Class
