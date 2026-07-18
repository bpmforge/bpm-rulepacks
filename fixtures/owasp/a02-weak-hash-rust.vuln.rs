fn fingerprint(data: &[u8]) -> Vec<u8> {
    md5::compute(data).0.to_vec()
}
