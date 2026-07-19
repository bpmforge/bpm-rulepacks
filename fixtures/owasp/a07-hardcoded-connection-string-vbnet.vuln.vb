Imports System.Data.SqlClient

Public Class DbConfig
    Public Shared ReadOnly ConnStr As String = "Server=prod-db;Database=Orders;User Id=sa;Password=SuperSecret123!;"

    Public Function OpenConnection() As SqlConnection
        Return New SqlConnection(ConnStr)
    End Function
End Class
