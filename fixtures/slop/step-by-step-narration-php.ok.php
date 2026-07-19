<?php

namespace App\Orders;

class OrderProcessor
{
    public function process(Order $order): void
    {
        $this->validate($order);
        $this->submit($order);
        $this->logResult($order);
    }
}
