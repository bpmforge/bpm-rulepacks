Imports System.Diagnostics
Imports System.Web

Public Class DiagnosticsController
    Public Sub RunTool(Request As HttpRequest)
        Dim action As String = Request.QueryString("action")
        Dim command As String
        If action = "backup" Then
            command = "backup.sh"
        Else
            command = "status.sh"
        End If
        Process.Start(command)
    End Sub
End Class
