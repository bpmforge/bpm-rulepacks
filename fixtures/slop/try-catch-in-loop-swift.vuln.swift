func processAll(items: [Item]) -> [Result?] {
    var results: [Result?] = []
    for item in items {
        do {
            results.append(try process(item))
        } catch {
            results.append(nil)
        }
    }
    return results
}
