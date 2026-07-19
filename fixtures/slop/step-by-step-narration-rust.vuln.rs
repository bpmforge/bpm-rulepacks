fn normalize_username(input: &str) -> String {
    // Step 1: trim whitespace
    let trimmed = input.trim();
    // Step 2: lowercase the result
    let lower = trimmed.to_lowercase();
    // Step 3: return the normalized value
    lower
}
