fn normalize_username(input: &str) -> String {
    // Normalize for case-insensitive comparison against stored usernames.
    let trimmed = input.trim();
    let lower = trimmed.to_lowercase();
    lower
}
