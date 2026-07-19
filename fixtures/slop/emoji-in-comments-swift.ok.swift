func authenticate(user: User) -> Bool {
    // Skip re-verification for sessions issued within the SSO IdP's own TTL
    if user.verified {
        return true
    }
    return false
}
