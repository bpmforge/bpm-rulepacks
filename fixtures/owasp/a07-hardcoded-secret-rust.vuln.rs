struct ClientConfig {
    host: String,
    password: String,
}

fn load_stripe_client() -> ClientConfig {
    let api_key = "sk_live_51H8xJ2eZvKYlo2C0aBcDeFgHiJkLmNoPqRsTuVwXyZ";
    let db_secret = "abc123".to_string();
    let auth_token = String::from("tok_abcdef123456");
    std::env::set_var("DB_PASSWORD", "Sup3rSecret!");
    env::set_var("API_TOKEN", "tok_9f8e7d6c5b4a");

    let cfg = ClientConfig {
        host: "db.internal".to_string(),
        password: "hunter2".to_string(),
    };

    let _ = api_key;
    let _ = db_secret;
    let _ = auth_token;
    cfg
}
