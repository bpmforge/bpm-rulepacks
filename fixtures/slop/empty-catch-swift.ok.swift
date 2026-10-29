func loadUser() {
    do {
        try risky()
    } catch {
        logger.error("loadUser failed: \(error)")
    }
}

// A stated reason makes the empty catch a decision.
func refresh() async {
    do {
        try await api.verifyCredentials()
    } catch {
        // nothing to do; the timer retries on the next tick
    }
}
