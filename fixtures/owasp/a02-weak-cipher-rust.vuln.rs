use des::cipher::KeyInit;
use des::Des;

fn encrypt_legacy(key: &[u8]) -> Des {
    Des::new(key.into())
}
