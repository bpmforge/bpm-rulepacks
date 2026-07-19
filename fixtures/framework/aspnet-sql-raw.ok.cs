using Microsoft.EntityFrameworkCore;

public class UserRepository
{
    private readonly AppDbContext _ctx;

    public UserRepository(AppDbContext ctx)
    {
        _ctx = ctx;
    }

    public List<User> FindByName(string name)
    {
        return _ctx.Users.FromSqlInterpolated($"SELECT * FROM Users WHERE Name = {name}").ToList();
    }

    public List<User> FindById(string id)
    {
        return _ctx.Users.FromSqlRaw("SELECT * FROM Users WHERE Id = {0}", id).ToList();
    }
}
