use std::fs::File;
use std::io::Read;

fn load_config() -> String {
    let mut file = File::open("config.toml").unwrap();
    let mut contents = String::new();
    file.read_to_string(&mut contents).unwrap();
    contents
}
