func authenticate(user: User) -> Bool {
    // 🚀 Fast path for already-verified sessions
    if user.verified {
        return true
    }
    return false
}
