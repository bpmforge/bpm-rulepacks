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
