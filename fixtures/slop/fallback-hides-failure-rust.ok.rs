fn load_config(path: &str) -> Result<Config, ConfigError> {
    match std::fs::read_to_string(path) {
        Ok(s) => Ok(parse_config(&s)),
        Err(e) => {
            log::warn!("failed to read config at {path}: {e}");
            Err(ConfigError::from(e))
        }
    }
}

fn load_config_direct(path: &str) -> Result<String, std::io::Error> {
    std::fs::read_to_string(path)
}

fn max_score(scores: &[i32]) -> i32 {
    scores.iter().max().copied().unwrap_or_default()
}

fn parse_config(_s: &str) -> Config {
    Config
}

struct Config;
struct ConfigError;
impl From<std::io::Error> for ConfigError {
    fn from(_e: std::io::Error) -> Self {
        ConfigError
    }
}
