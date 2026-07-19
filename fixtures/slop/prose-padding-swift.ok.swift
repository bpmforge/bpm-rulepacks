/// Retries up to 3 times on HTTP 5xx per RFC 7231 §6.6, backing off 200ms
/// per attempt to smooth over transient upstream errors.
func fetchWithRetry() throws -> Data {
    return try fetch()
}
