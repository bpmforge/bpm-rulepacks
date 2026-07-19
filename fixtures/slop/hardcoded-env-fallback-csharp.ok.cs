using System;

class ApiClient
{
    private readonly string _apiKey;
    private readonly string _port;

    public ApiClient()
    {
        _apiKey = Environment.GetEnvironmentVariable("API_KEY")
            ?? throw new InvalidOperationException("API_KEY is required");
        _port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
    }

    public void Send()
    {
        Console.WriteLine(_apiKey);
    }
}
