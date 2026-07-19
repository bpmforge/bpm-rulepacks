<?php

namespace App\Config;

class ApiClient
{
    public function getApiKey(): string
    {
        $key = getenv('API_SECRET_KEY');
        if ($key === false) {
            throw new \RuntimeException('API_SECRET_KEY is required but not set');
        }
        return $key;
    }

    public function getDbPassword(): string
    {
        if (!isset($_ENV['DB_PASSWORD'])) {
            throw new \RuntimeException('DB_PASSWORD is required but not set');
        }
        return $_ENV['DB_PASSWORD'];
    }

    public function getPort(): string
    {
        // non-secret config is fine to default
        return getenv('PORT') ?: '3000';
    }
}
