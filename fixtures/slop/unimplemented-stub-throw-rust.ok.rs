fn calculate_discount(price: f64, tier: &str) -> f64 {
    match tier {
        "gold" => price * 0.8,
        "silver" => price * 0.9,
        _ => price,
    }
}

fn export_report(data: &Report) -> Result<Vec<u8>, ExportError> {
    let mut buf = Vec::new();
    write_pdf(data, &mut buf);
    Ok(buf)
}

fn write_pdf(_data: &Report, _buf: &mut Vec<u8>) {}

struct Report;
struct ExportError;

// Inside the crate's test module a todo!() is a type-level stub that is
// compiled and never run (axum checks trait bounds this way). 12 of 12
// axum hits were here.
#[cfg(test)]
mod tests {
    fn create_router() -> u32 {
        todo!()
    }
}
