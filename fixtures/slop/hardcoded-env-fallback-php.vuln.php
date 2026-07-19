<?php

namespace App\Config;

class ApiClient
{
    public function getApiKey(): string
    {
        return getenv('API_SECRET_KEY') ?: 'sk-live-1234567890abcdef';
    }

    public function getDbPassword(): string
    {
        return $_ENV['DB_PASSWORD'] ?? 'dev-password-123';
    }
}
