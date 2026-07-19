<?php

namespace App\Services;

class PaymentGateway
{
    public function apiKey(): string
    {
        return config('services.stripe.secret');
    }
}
