using System.Net.Http;

class ApiClient
{
    public HttpClient Build()
    {
        var handler = new HttpClientHandler();
        handler.ServerCertificateCustomValidationCallback = (msg, cert, chain, errors) => true;
        return new HttpClient(handler);
    }
}
