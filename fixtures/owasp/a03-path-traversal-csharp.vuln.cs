using System.IO;
using System.Web;

class DownloadController
{
    public string ReadFile(HttpRequest Request)
    {
        var fileName = Request.QueryString["file"];
        return File.ReadAllText(fileName);
    }
}
