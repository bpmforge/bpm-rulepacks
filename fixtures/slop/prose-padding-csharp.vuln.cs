class UserService
{
    /// <summary>Looks up a user.</summary>
    /// <param name="userId">the userId</param>
    /// <returns>the user record</returns>
    public User Lookup(string userId)
    {
        return Db.Find(userId);
    }
}

class User { }
static class Db
{
    public static User Find(string id) => null;
}
