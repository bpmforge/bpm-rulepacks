use reqwest::Client;

fn build_client() -> reqwest::Result<Client> {
    Client::builder().danger_accept_invalid_certs(true).build()
}
