using Microsoft.AspNetCore.Mvc;

public class UserController : Controller
{
    [HttpPost]
    public IActionResult Edit([Bind("Id,Name,Email")] User user)
    {
        return Ok();
    }
}
