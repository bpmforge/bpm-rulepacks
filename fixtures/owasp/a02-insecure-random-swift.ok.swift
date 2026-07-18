import Security

func generateSessionToken() -> String {
    var bytes = [UInt8](repeating: 0, count: 32)
    _ = SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes)
    return bytes.map { String(format: "%02x", $0) }.joined()
}

func rollDice() -> Int {
    // Non-security randomness: arc4random is fine here, and the variable
    // name is not security-shaped, so the rule must stay silent.
    let diceRoll = arc4random_uniform(6) + 1
    return Int(diceRoll)
}
