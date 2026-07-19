using Microsoft.AspNetCore.Http;

public class AuthCookieFactory
{
    public CookieOptions BuildSessionCookie()
    {
        return new CookieOptions
        {
            Secure = false,
            HttpOnly = true,
            SameSite = SameSiteMode.Strict,
        };
    }
}
