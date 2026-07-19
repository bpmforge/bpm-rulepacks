func loadItems() throws -> [Item] {
    do {
        return try fetchItems()
    } catch {
        logger.error("loadItems failed: \(error)")
        throw error
    }
}

func loadName() -> String {
    if let name = try? fetchName() {
        return name
    }
    logger.error("fetchName failed, using anonymous")
    return "anonymous"
}
