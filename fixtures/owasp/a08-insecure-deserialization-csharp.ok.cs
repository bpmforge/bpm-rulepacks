using System.Text.Json;

class SessionStore
{
    public SessionData LoadSession(string cookieJson)
    {
        return JsonSerializer.Deserialize<SessionData>(cookieJson);
    }
}

class SessionData
{
    public string UserId { get; set; }
}
