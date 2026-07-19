Imports System.Data.SqlClient
Imports System.Configuration

Public Class DbConfig
    Public Function OpenConnection() As SqlConnection
        Dim connStr As String = ConfigurationManager.ConnectionStrings("OrdersDb").ConnectionString
        Return New SqlConnection(connStr)
    End Function
End Class
