using System.Diagnostics;
using System.Web;

class DiagnosticsController
{
    public void RunTool(HttpRequest Request)
    {
        var toolName = Request.QueryString["tool"];
        Process.Start(toolName);
    }
}
