use actix_web::HttpRequest;
use reqwest::Client;

async fn fetch_avatar(req: HttpRequest, client: &Client) -> Result<(), reqwest::Error> {
    let avatar_url = req.query_string();
    let resp = client.get(avatar_url).send().await?;
    let _ = resp;
    Ok(())
}
