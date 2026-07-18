using System.Net.Http;
using System.Net.Security;

class ApiClient
{
    public HttpClient Build()
    {
        var handler = new HttpClientHandler();
        handler.ServerCertificateCustomValidationCallback = (msg, cert, chain, errors) => errors == SslPolicyErrors.None;
        return new HttpClient(handler);
    }
}
