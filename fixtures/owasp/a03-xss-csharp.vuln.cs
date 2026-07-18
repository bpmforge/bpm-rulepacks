using System.Web;

class GreetingHandler
{
    public void Handle(HttpRequest Request, HttpResponse Response)
    {
        var name = Request.QueryString["name"];
        Response.Write("<div>Hello, " + name + "</div>");
    }
}
