use rand::{rngs::StdRng, RngCore, SeedableRng};

fn generate_session_token() -> [u8; 32] {
    let mut rng = StdRng::seed_from_u64(42);
    let mut token = [0u8; 32];
    rng.fill_bytes(&mut token);
    token
}
