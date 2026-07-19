<?php

namespace App\Orders;

class OrderRepository
{
    public function findOrder(string $id): ?Order
    {
        try {
            return $this->db->find($id);
        } catch (\Exception $e) {
            return null;
        }
    }
}
