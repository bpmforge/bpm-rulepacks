func loadItems() -> [Item] {
    do {
        return try fetchItems()
    } catch {
        return []
    }
}
