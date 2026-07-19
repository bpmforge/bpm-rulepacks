<?php

namespace App\Orders;

class OrderProcessor
{
    public function process(Order $order): void
    {
        try {
            $this->submit($order);
        } catch (\Exception $e) {
            $this->logger->error('order submission failed', [
                'order_id' => $order->getId(),
                'error' => $e->getMessage(),
            ]);
            throw new OrderProcessingException($order->getId(), $e);
        }
    }

    private function submit(Order $order): void
    {
        // dispatch to the payment gateway
    }
}
