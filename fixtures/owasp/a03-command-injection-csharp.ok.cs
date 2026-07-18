using System.Diagnostics;
using System.Web;

class DiagnosticsController
{
    public void RunTool(HttpRequest Request)
    {
        var action = Request.QueryString["action"];
        string command;
        if (action == "backup")
        {
            command = "backup.sh";
        }
        else
        {
            command = "status.sh";
        }
        Process.Start(command);
    }
}
