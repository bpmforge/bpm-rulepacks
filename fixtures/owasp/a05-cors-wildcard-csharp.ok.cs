using Microsoft.Extensions.DependencyInjection;

class Startup
{
    public void ConfigureServices(IServiceCollection services)
    {
        services.AddCors(options =>
        {
            options.AddPolicy("Trusted", builder =>
            {
                builder.WithOrigins("https://app.example.com")
                       .WithMethods("GET", "POST")
                       .WithHeaders("Content-Type", "Authorization");
            });
        });
    }
}
