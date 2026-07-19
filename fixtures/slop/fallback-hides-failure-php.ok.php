<?php

namespace App\Orders;

class OrderRepository
{
    /**
     * @throws OrderLookupException when the underlying query fails
     */
    public function findOrder(string $id): ?Order
    {
        try {
            return $this->db->find($id);
        } catch (\Exception $e) {
            $this->logger->error('order lookup failed', ['order_id' => $id, 'error' => $e->getMessage()]);
            throw new OrderLookupException($id, $e);
        }
    }
}
