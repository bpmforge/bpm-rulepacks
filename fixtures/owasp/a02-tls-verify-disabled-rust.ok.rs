use reqwest::{Certificate, Client};

fn build_client(private_ca_pem: &[u8]) -> reqwest::Result<Client> {
    let ca_cert = Certificate::from_pem(private_ca_pem)?;
    Client::builder().add_root_certificate(ca_cert).build()
}
