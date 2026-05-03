package com.carpooling;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordHasherTest {
    @Test
    public void hashPassword() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String password = "AaiBaba@01";
        String hash = encoder.encode(password);
        System.out.println("HASHED_PASSWORD=" + hash);
    }
}
