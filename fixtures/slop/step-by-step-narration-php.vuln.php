<?php

namespace App\Orders;

class OrderProcessor
{
    public function process(Order $order): void
    {
        // Step 1: validate the order
        $this->validate($order);
        // Step 2: submit the order to the gateway
        $this->submit($order);
        # Step 3: log the result
        $this->logResult($order);
    }
}
