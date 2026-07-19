using Microsoft.AspNetCore.Html;
using Microsoft.AspNetCore.Mvc.Rendering;

public class CommentView
{
    public IHtmlContent RenderBody(IHtmlHelper Html, Comment comment)
    {
        return Html.Raw(comment.Body);
    }
}
