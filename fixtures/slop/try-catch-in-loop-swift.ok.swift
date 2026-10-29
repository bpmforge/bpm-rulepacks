func processAll(items: [Item]) throws {
    do {
        for item in items {
            try process(item)
        }
    } catch {
        logger.error("processAll failed: \(error)")
        throw error
    }
}

// A poll loop that keeps the error for the next tick, or reports it, is handling it.
func poll(registration: Registration) async {
    while !Task.isCancelled {
        do {
            let account = try await api.verifyCredentials(registration)
            update(account)
        } catch let error as APIError where error.status == .unauthorized {
            markExpired()
        } catch {
            logger.warning("poll failed: \(error)")
        }
    }
}
