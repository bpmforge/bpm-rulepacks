use actix_web::HttpRequest;
use std::fs;
use std::path::Path;

const UPLOAD_DIR: &str = "/srv/uploads";

fn read_upload(req: HttpRequest) -> std::io::Result<String> {
    let filename = req.match_info().get("filename").unwrap_or_default();
    let contents = fs::read_to_string(filename)?;
    Ok(contents)
}

// Regression: the sanitizer must clear only the checked, canonicalized
// variable itself — a second, unchecked request-derived path used later
// in the same function (after an unrelated canonicalize+prefix-check) must
// still fire.
fn read_upload_second_unchecked_path(req: HttpRequest) -> std::io::Result<String> {
    let filename_a = req.match_info().get("a").unwrap_or_default();
    let candidate = Path::new(UPLOAD_DIR).join(filename_a);
    let resolved = fs::canonicalize(&candidate)?;
    if !resolved.starts_with(UPLOAD_DIR) {
        return Err(std::io::Error::new(
            std::io::ErrorKind::PermissionDenied,
            "path escapes upload dir",
        ));
    }
    let _kept = fs::read_to_string(&resolved)?;

    let filename_b = req.query_string();
    fs::read_to_string(filename_b)
}
