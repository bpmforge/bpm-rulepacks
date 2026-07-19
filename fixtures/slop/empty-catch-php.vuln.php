<?php

namespace App\Orders;

class OrderProcessor
{
    public function process(Order $order): void
    {
        try {
            $this->submit($order);
        } catch (\Exception $e) {
        }
    }

    private function submit(Order $order): void
    {
        // dispatch to the payment gateway
    }
}
