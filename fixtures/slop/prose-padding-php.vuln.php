<?php

namespace App\Orders;

class OrderValidator
{
    /**
     * It's worth noting that this function validates the order.
     *
     * @param int $id the id
     */
    public function validateOrder(int $id): bool
    {
        return $id > 0;
    }

    // It is important to note that this follows industry best practices.
    public function submitOrder(int $id): bool
    {
        return true;
    }
}
