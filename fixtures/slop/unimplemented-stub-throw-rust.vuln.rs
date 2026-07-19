fn calculate_discount(price: f64, tier: &str) -> f64 {
    todo!()
}

fn export_report(data: &Report) -> Result<Vec<u8>, ExportError> {
    unimplemented!("PDF export not yet supported")
}

struct Report;
struct ExportError;
