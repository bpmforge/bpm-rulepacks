Imports System.Security.Cryptography

Public Class PasswordHasher
    Public Function Hash(password As Byte()) As Byte()
        Using sha As SHA256 = SHA256.Create()
            Return sha.ComputeHash(password)
        End Using
    End Function
End Class
