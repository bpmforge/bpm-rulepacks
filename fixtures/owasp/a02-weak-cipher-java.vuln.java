package com.example.crypto;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;

public class LegacyEncryptor {

    public byte[] encrypt(SecretKey key, byte[] plaintext) throws Exception {
        Cipher cipher = Cipher.getInstance("DES/CBC/PKCS5Padding");
        cipher.init(Cipher.ENCRYPT_MODE, key);
        return cipher.doFinal(plaintext);
    }
}
