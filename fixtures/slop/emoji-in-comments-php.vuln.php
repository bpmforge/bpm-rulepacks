<?php

namespace App\Orders;

// This handles the order flow perfectly! ✅
class OrderProcessor
{
    public function process(Order $order): void
    {
        # Submit the order 🚀
        $this->submit($order);
    }

    /* All done here 🎉 */
    private function submit(Order $order): void
    {
        // dispatch to the payment gateway
    }
}
