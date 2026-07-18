<?php

function encryptField(string $data, string $key): string {
    $iv = random_bytes(12);
    $tag = '';
    return $iv . openssl_encrypt($data, 'aes-256-gcm', $key, OPENSSL_RAW_DATA, $iv, $tag);
}
