using Microsoft.AspNetCore.Mvc;

public class AccountController : Controller
{
    [HttpPost]
    [IgnoreAntiforgeryToken]
    public IActionResult UpdateEmail(string newEmail)
    {
        return Ok();
    }
}
