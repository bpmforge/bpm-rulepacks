Imports System.Text.Json

Public Class SessionStore
    Public Function LoadSession(cookieJson As String) As SessionData
        Return JsonSerializer.Deserialize(Of SessionData)(cookieJson)
    End Function
End Class

Public Class SessionData
    Public Property UserId As String
End Class
