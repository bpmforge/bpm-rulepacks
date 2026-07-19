use actix_web::HttpRequest;
use reqwest::Client;
use url::Url;

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

const ALLOWED_HOSTS: [&str; 2] = ["avatars.trusted-cdn.example", "api.trusted-cdn.example"];

async fn fetch_avatar_validated(
    req: HttpRequest,
    client: &Client,
) -> Result<(), reqwest::Error> {
    let requested = req.query_string();
    // url::Url::parse + host allowlist .contains() check (the
    // pattern-sanitizer pair) — `requested` itself, not a hardcoded
    // literal, is what reaches the sink, proving the sanitizer clears it
    // rather than just avoiding the tainted value.
    let parsed = Url::parse(requested).unwrap();
    if !ALLOWED_HOSTS.contains(&parsed.host_str().unwrap_or("")) {
        panic!("host not on allowlist");
    }
    let resp = client.get(requested).send().await?;
    let _ = resp;
    Ok(())
}
