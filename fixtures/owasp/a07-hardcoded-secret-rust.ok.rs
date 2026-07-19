struct ClientConfig {
    host: String,
    password: String,
}

fn load_stripe_client() -> ClientConfig {
    let api_key = std::env::var("STRIPE_API_KEY").expect("STRIPE_API_KEY not set");
    let db_secret = std::env::var("DB_SECRET").unwrap_or_default();
    let auth_token = std::env::var("API_TOKEN").unwrap_or_default();
    std::env::set_var(
        "DB_PASSWORD",
        std::env::var("DB_PASSWORD_SEED").unwrap_or_default(),
    );
    env::set_var(
        "API_TOKEN",
        std::env::var("API_TOKEN_SEED").unwrap_or_default(),
    );

    let cfg = ClientConfig {
        host: "db.internal".to_string(),
        password: std::env::var("DB_PASSWORD").unwrap_or_default(),
    };

    let _ = api_key;
    let _ = db_secret;
    let _ = auth_token;
    cfg
}
