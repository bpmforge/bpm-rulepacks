func apiKey() -> String {
    return ProcessInfo.processInfo.environment["API_SECRET_KEY"] ?? "sk-live-1234567890"
}
