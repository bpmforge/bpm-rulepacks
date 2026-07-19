use actix_web::HttpRequest;
use std::process::Command;

fn ping_host(req: HttpRequest) -> std::io::Result<()> {
    let host = req.query_string();
    let output = Command::new("ping").arg("-c").arg("1").arg(host).output()?;
    let _ = output;
    Ok(())
}

// Regression: parse::<String>() is an infallible identity conversion (does
// NOT constrain content), so it must NOT be treated as a sanitizer — the
// $T type-allowlist must reject non-numeric/non-bool types and this must
// still fire.
fn ping_host_string_parse(req: HttpRequest) -> std::io::Result<()> {
    let raw = req.query_string();
    let host = raw.parse::<String>().unwrap();
    let output = Command::new("ping").arg(host).output()?;
    let _ = output;
    Ok(())
}

// Regression: signed/float types can still carry a leading `-` (flag
// injection into a shell-free Command), so only unsigned integer types
// genuinely neutralize this sink — a signed parse::<i32>() must still fire.
fn ping_host_signed_parse(req: HttpRequest) -> std::io::Result<()> {
    let raw = req.query_string();
    let n = raw.parse::<i32>().unwrap_or(0);
    let output = Command::new("ping").arg(n.to_string()).output()?;
    let _ = output;
    Ok(())
}
