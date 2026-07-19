<?php

namespace App\Services;

class PaymentGateway
{
    public function apiKey(): string
    {
        return env('STRIPE_SECRET_KEY');
    }
}
