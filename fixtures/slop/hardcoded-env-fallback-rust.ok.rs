fn get_port() -> String {
    std::env::var("PORT").unwrap_or("3000".to_string())
}

fn get_log_level() -> String {
    env::var("LOG_LEVEL").unwrap_or_else(|_| "info".to_string())
}

fn get_api_key() -> String {
    std::env::var("API_KEY").unwrap_or_else(|_| panic!("API_KEY must be set"))
}
