using Microsoft.AspNetCore.Cors.Infrastructure;

public class CorsConfig
{
    public void Configure(CorsPolicyBuilder policy)
    {
        policy.SetIsOriginAllowed(origin => true).AllowCredentials();
    }
}
