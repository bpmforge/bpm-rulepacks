Imports System.Diagnostics
Imports System.Web

Public Class DiagnosticsController
    Public Sub RunTool(Request As HttpRequest)
        Dim toolName As String = Request.QueryString("tool")
        Process.Start(toolName)
    End Sub
End Class
