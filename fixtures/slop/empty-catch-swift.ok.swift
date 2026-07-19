func loadUser() {
    do {
        try risky()
    } catch {
        logger.error("loadUser failed: \(error)")
    }
}
