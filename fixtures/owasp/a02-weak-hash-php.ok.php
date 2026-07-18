<?php

function hashPassword(string $password): string {
    return password_hash($password, PASSWORD_ARGON2ID);
}
