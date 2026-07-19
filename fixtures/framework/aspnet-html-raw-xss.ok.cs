using Microsoft.AspNetCore.Html;
using Microsoft.AspNetCore.Mvc.Rendering;

public class CommentView
{
    public IHtmlContent RenderDivider(IHtmlHelper Html)
    {
        // Fixed, trusted markup — not attacker-influenced.
        return Html.Raw("<hr class=\"divider\" />");
    }

    public string RenderBody(Comment comment)
    {
        // Razor's default @value output HTML-encodes automatically; no
        // Html.Raw() call is needed (or safe) for user-supplied content.
        return comment.Body;
    }
}
