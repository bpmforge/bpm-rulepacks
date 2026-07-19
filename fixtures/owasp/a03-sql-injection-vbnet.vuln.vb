Imports System.Data.SqlClient

Public Class UserRepository
    Public Sub FindByName(conn As SqlConnection, userName As String)
        Dim cmd As New SqlCommand("SELECT * FROM Users WHERE Name = '" & userName & "'", conn)
        cmd.ExecuteReader()
    End Sub

    Public Sub FindById(conn As SqlConnection, userId As String)
        Dim cmd As New SqlCommand(conn)
        cmd.CommandText = "SELECT * FROM Users WHERE Id = '" & userId & "'"
        cmd.ExecuteReader()
    End Sub
End Class
