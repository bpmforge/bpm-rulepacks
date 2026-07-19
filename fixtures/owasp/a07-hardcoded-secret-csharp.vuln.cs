using System.Net.Http;

class PaymentGatewayClient
{
    public HttpClient BuildClient()
    {
        string apiKey = "sk_live_51H8xJ2eZvKYlo2C0aBcDeFgHiJkLmNoPqRsTuVwXyZ";
        var client = new HttpClient();
        client.DefaultRequestHeaders.Add("Authorization", "Bearer " + apiKey);
        return client;
    }

    public string GetConnectionString()
    {
        string connectionString = "Server=db.internal;Database=payments;User Id=sa;Password=Sup3rSecret!;";
        return connectionString;
    }
}
