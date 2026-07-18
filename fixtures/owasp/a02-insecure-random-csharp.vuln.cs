class TokenService
{
    public string GenerateApiToken()
    {
        var apiToken = new Random().Next(100000, 999999).ToString();
        return apiToken;
    }
}
