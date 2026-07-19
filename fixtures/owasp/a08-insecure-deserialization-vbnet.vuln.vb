Imports System.IO
Imports System.Runtime.Serialization.Formatters.Binary

Public Class SessionStore
    Public Function LoadSession(cookieBlob As Stream) As Object
        Dim formatter As New BinaryFormatter()
        Return formatter.Deserialize(cookieBlob)
    End Function
End Class
