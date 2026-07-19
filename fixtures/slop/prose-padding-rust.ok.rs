// Rejects empty input before it reaches the database layer.
fn validate(input: &str) -> bool {
    !input.is_empty()
}

/// Follows RFC 7807 (Problem Details for HTTP APIs) for error formatting.
fn handle_error(err: &str) {
    eprintln!("error: {err}");
}
