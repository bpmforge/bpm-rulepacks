using System.Web;

class GreetingHandler
{
    public void Handle(HttpRequest Request, HttpResponse Response)
    {
        var theme = Request.QueryString["theme"];
        string safeTheme;
        if (theme == "dark")
        {
            safeTheme = "dark";
        }
        else
        {
            safeTheme = "light";
        }
        Response.Write("<div class='" + safeTheme + "'></div>");
    }
}
