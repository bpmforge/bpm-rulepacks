using System;
using System.Net.Http;
using Microsoft.Extensions.Configuration;

class PaymentGatewayClient
{
    private readonly IConfiguration _config;

    public PaymentGatewayClient(IConfiguration config)
    {
        _config = config;
    }

    public HttpClient BuildClient()
    {
        string apiKey = Environment.GetEnvironmentVariable("STRIPE_API_KEY");
        var client = new HttpClient();
        client.DefaultRequestHeaders.Add("Authorization", "Bearer " + apiKey);
        return client;
    }

    public string GetConnectionString()
    {
        string connectionString = _config.GetConnectionString("Payments");
        return connectionString;
    }
}
