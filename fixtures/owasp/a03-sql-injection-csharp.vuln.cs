using System.Data.SqlClient;

class UserRepository
{
    public void FindByName(SqlConnection conn, string userName)
    {
        var cmd = new SqlCommand($"SELECT * FROM Users WHERE Name = '{userName}'", conn);
        cmd.ExecuteReader();
    }

    public void FindById(SqlConnection conn, string userId)
    {
        var cmd = new SqlCommand(conn);
        cmd.CommandText = "SELECT * FROM Users WHERE Id = '" + userId + "'";
        cmd.ExecuteReader();
    }
}
