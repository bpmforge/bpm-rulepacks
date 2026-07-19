using Microsoft.AspNetCore.Cors.Infrastructure;

public class CorsConfig
{
    public void Configure(CorsPolicyBuilder policy)
    {
        policy.WithOrigins("https://app.example.com").AllowCredentials();
    }
}
