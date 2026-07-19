using System;

class ApiClient
{
    private readonly string _apiKey =
        Environment.GetEnvironmentVariable("API_KEY") ?? "sk-test-1234567890abcdef";

    public void Send()
    {
        Console.WriteLine(_apiKey);
    }
}
