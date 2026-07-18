using System.Data.SqlClient;

class UserRepository
{
    public void FindByName(SqlConnection conn, string userName)
    {
        var cmd = new SqlCommand("SELECT * FROM Users WHERE Name = @name", conn);
        cmd.Parameters.AddWithValue("@name", userName);
        cmd.ExecuteReader();
    }

    public void FindById(SqlConnection conn, string userId)
    {
        var cmd = new SqlCommand(conn);
        cmd.CommandText = "SELECT * FROM Users WHERE Id = @id";
        cmd.Parameters.AddWithValue("@id", userId);
        cmd.ExecuteReader();
    }
}
