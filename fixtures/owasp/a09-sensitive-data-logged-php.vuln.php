<?php

function handleLogin(string $username, string $password): void {
    $logger->info("Login attempt", ['username' => $username, 'password' => $password]);
    $logger->error("Auth failed", ['token' => $sessionToken]);
}
