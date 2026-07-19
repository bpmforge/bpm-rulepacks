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

fn run_diagnostic(req: HttpRequest) -> std::io::Result<()> {
    let raw = req.query_string();
    // Type-coerced through parse::<u32>() (the pattern-sanitizer): only a
    // decimal-digit case ID can survive, so no flag/argument injection is
    // possible even though the sanitized value flows straight to arg().
    let case_id = raw.parse::<u32>().unwrap_or(0);
    let output = Command::new("diag").arg(case_id.to_string()).output()?;
    let _ = output;
    Ok(())
}
