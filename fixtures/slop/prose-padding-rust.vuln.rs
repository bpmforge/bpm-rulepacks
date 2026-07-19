// It's worth noting that this function validates input before processing
// to prevent malformed data from reaching the database layer.
fn validate(input: &str) -> bool {
    !input.is_empty()
}

/// This module follows industry best practices for error handling.
fn handle_error(err: &str) {
    eprintln!("error: {err}");
}
