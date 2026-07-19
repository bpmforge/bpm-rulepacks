func port() -> String {
    return ProcessInfo.processInfo.environment["PORT"] ?? "3000"
}

func apiKey() throws -> String {
    guard let key = ProcessInfo.processInfo.environment["API_SECRET_KEY"] else {
        throw ConfigError.missingRequiredEnv("API_SECRET_KEY")
    }
    return key
}
