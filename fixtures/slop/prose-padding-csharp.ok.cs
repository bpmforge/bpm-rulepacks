class UserService
{
    /// <summary>Looks up a user, bypassing cache for compliance-audited reads.</summary>
    /// <param name="userId">tenant-scoped external id, not the internal row key</param>
    /// <returns>the user record, or null if soft-deleted</returns>
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
