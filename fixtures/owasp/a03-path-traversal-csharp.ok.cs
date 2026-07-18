using System.IO;
using System.Web;

class DownloadController
{
    public string ReadFile(HttpRequest Request)
    {
        var fileId = Request.QueryString["fileId"];
        string fileName;
        if (fileId == "1")
        {
            fileName = "/var/app/uploads/report1.txt";
        }
        else
        {
            fileName = "/var/app/uploads/report2.txt";
        }
        return File.ReadAllText(fileName);
    }
}
