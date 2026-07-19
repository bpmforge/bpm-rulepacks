func computeTotal(items: [Item]) -> Double {
    return items.reduce(0) { $0 + $1.price }
}

func validateAmount(_ amount: Double) {
    precondition(amount > 0, "amount must be positive")
}
