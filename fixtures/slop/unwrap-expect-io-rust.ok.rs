use std::fs::File;
use std::io::Read;

fn load_config() -> std::io::Result<String> {
    let mut file = File::open("config.toml")?;
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    Ok(contents)
}
