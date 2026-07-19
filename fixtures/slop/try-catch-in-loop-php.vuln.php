<?php

namespace App\Orders;

class BatchProcessor
{
    public function processAll(array $orders): void
    {
        foreach ($orders as $order) {
            try {
                $this->submit($order);
            } catch (\Exception $e) {
                echo "skipping order\n";
            }
        }
    }

    private function submit(Order $order): void
    {
        // dispatch to the payment gateway
    }
}
