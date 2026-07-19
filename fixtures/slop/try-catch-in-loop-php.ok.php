<?php

namespace App\Orders;

class BatchProcessor
{
    public function processAll(array $orders): void
    {
        try {
            foreach ($orders as $order) {
                $this->submit($order);
            }
        } catch (\Exception $e) {
            $this->logger->error('batch submission failed', ['error' => $e->getMessage()]);
            throw new BatchProcessingException($e);
        }
    }

    private function submit(Order $order): void
    {
        // dispatch to the payment gateway
    }
}
