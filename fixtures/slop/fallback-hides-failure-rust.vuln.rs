fn load_config(path: &str) -> Config {
    match std::fs::read_to_string(path) {
        Ok(s) => parse_config(&s),
        Err(_) => Default::default(),
    }
}

fn load_bytes(path: &str) -> Vec<u8> {
    fs::read(path).unwrap_or_default()
}

fn parse_config(_s: &str) -> Config {
    Config
}

struct Config;
impl Default for Config {
    fn default() -> Self {
        Config
    }
}
