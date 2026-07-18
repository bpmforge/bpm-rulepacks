use actix_web::HttpRequest;
use std::process::Command;

fn ping_host(req: HttpRequest) -> std::io::Result<()> {
    let host = req.query_string();
    let output = Command::new("ping").arg("-c").arg("1").arg(host).output()?;
    let _ = output;
    Ok(())
}
