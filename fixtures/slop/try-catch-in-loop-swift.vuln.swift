func processAll(items: [Item]) {
    for item in items {
        do {
            try process(item)
        } catch {
            print("failed: \(error)")
        }
    }
}
