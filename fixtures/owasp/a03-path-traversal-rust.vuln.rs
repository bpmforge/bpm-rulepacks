use actix_web::HttpRequest;
use std::fs;

fn read_upload(req: HttpRequest) -> std::io::Result<String> {
    let filename = req.match_info().get("filename").unwrap_or_default();
    let contents = fs::read_to_string(filename)?;
    Ok(contents)
}
