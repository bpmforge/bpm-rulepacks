<?php

namespace App\Orders;

// Coordinates order submission and retry against the payment gateway.
class OrderProcessor
{
    public function process(Order $order): void
    {
        # Submit the order for processing.
        $this->submit($order);
    }

    /* Dispatches to the payment gateway. */
    private function submit(Order $order): void
    {
        // dispatch to the payment gateway
    }
}
