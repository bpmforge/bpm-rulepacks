/// It's worth noting that this function retries transient network failures
/// following industry best practices.
func fetchWithRetry() throws -> Data {
    return try fetch()
}
