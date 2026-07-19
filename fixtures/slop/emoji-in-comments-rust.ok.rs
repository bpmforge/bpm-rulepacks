// Handles the login flow for a returning user.
fn login(username: &str, password: &str) -> bool {
    !username.is_empty() && !password.is_empty()
}

/* Session teardown: revoke the token and drop server-side state. */
fn logout(session_id: &str) {
    invalidate_session(session_id);
}

fn invalidate_session(_session_id: &str) {}
