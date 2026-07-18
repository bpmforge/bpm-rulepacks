use actix_web::HttpRequest;
use reqwest::Client;

async fn fetch_avatar(req: HttpRequest, client: &Client) -> Result<(), reqwest::Error> {
    let requested_id = req.query_string();
    // Every branch below yields a fixed URL literal, never `requested_id`
    // itself, so no request-controlled data can reach the outbound request.
    let safe_url: &str = match requested_id {
        "alice" => "https://avatars.trusted-cdn.example/alice.png",
        "bob" => "https://avatars.trusted-cdn.example/bob.png",
        _ => "https://avatars.trusted-cdn.example/default.png",
    };
    let resp = client.get(safe_url).send().await?;
    let _ = resp;
    Ok(())
}
