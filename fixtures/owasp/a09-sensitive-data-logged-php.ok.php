<?php

function handleLogin(string $username, string $password): void {
    $logger->info("Login attempt", ['username' => $username]);
    $logger->error("Auth failed", ['reason' => 'invalid_credentials']);
}
