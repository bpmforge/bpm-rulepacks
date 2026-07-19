fn get_api_key() -> String {
    std::env::var("API_KEY").unwrap_or("sk-default-devkey-12345".to_string())
}

fn get_db_password() -> String {
    env::var("DB_PASSWORD").unwrap_or_else(|_| "changeme".to_string())
}
