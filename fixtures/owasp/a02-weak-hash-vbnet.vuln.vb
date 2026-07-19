Imports System.Security.Cryptography

Public Class PasswordHasher
    Public Function Hash(password As Byte()) As Byte()
        Using md5 As MD5 = MD5.Create()
            Return md5.ComputeHash(password)
        End Using
    End Function
End Class
