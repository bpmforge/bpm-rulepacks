fun ping(host: String) {
    ProcessBuilder("ping", "-c", "1", host).start()
}
