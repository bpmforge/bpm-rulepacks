<?php

function encryptField(string $data, string $key): string {
    return mcrypt_encrypt(MCRYPT_DES, $key, $data, MCRYPT_MODE_ECB);
}
