use actix_web::HttpRequest;
use std::process::Command;

fn ping_host(req: HttpRequest) -> std::io::Result<()> {
    let requested = req.query_string();
    // Every branch below yields a fixed string literal, never `requested`
    // itself, so no request-controlled data can reach Command's argv.
    let host: &str = match requested {
        "internal-monitor" => "internal-monitor",
        "healthcheck" => "healthcheck",
        _ => "internal-monitor",
    };
    let output = Command::new("ping").arg("-c").arg("1").arg(host).output()?;
    let _ = output;
    Ok(())
}
