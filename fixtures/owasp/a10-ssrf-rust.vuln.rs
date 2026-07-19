use actix_web::HttpRequest;
use reqwest::Client;
use url::Url;

async fn fetch_avatar(req: HttpRequest, client: &Client) -> Result<(), reqwest::Error> {
    let avatar_url = req.query_string();
    let resp = client.get(avatar_url).send().await?;
    let _ = resp;
    Ok(())
}

const ALLOWED_HOSTS: [&str; 1] = ["avatars.trusted-cdn.example"];

// Regression: the sanitizer must clear only the checked, allowlist-verified
// URL itself — a second, unchecked request-derived URL used later in the
// same function (after an unrelated Url::parse+allowlist check) must still
// fire.
async fn fetch_two_urls_second_unchecked(
    req: HttpRequest,
    client: &Client,
) -> Result<(), reqwest::Error> {
    let url_a = req.query_string();
    let parsed = Url::parse(url_a).unwrap();
    if !ALLOWED_HOSTS.contains(&parsed.host_str().unwrap_or("")) {
        panic!("host not on allowlist");
    }
    let _resp_a = client.get(url_a).send().await?;

    let url_b = req.match_info().get("target").unwrap_or_default();
    let resp_b = client.get(url_b).send().await?;
    let _ = resp_b;
    Ok(())
}
