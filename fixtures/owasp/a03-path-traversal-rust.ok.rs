use actix_web::HttpRequest;
use std::fs;
use std::path::Path;

const UPLOAD_DIR: &str = "/srv/uploads";

fn read_upload(req: HttpRequest) -> std::io::Result<String> {
    let filename = req.match_info().get("filename").unwrap_or_default();
    let candidate = Path::new(UPLOAD_DIR).join(filename);
    let resolved = fs::canonicalize(&candidate)?;
    if !resolved.starts_with(UPLOAD_DIR) {
        return Err(std::io::Error::new(
            std::io::ErrorKind::PermissionDenied,
            "path escapes upload dir",
        ));
    }
    fs::read_to_string("/srv/uploads/default.txt")
}
