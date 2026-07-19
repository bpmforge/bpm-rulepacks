Imports System.Data.SqlClient

Public Class UserRepository
    Public Sub FindByName(conn As SqlConnection, userName As String)
        Dim cmd As New SqlCommand("SELECT * FROM Users WHERE Name = @name", conn)
        cmd.Parameters.AddWithValue("@name", userName)
        cmd.ExecuteReader()
    End Sub

    Public Sub FindById(conn As SqlConnection, userId As String)
        Dim cmd As New SqlCommand(conn)
        cmd.CommandText = "SELECT * FROM Users WHERE Id = @id"
        cmd.Parameters.AddWithValue("@id", userId)
        cmd.ExecuteReader()
    End Sub
End Class
