use rand::{rngs::OsRng, RngCore};

fn generate_session_token() -> [u8; 32] {
    let mut rng = OsRng;
    let mut token = [0u8; 32];
    rng.fill_bytes(&mut token);
    token
}
