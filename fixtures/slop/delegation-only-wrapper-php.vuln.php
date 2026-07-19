<?php

namespace App\Orders;

class OrderService
{
    private OrderRepository $repo;

    public function __construct(OrderRepository $repo)
    {
        $this->repo = $repo;
    }

    public function findOrder(string $id)
    {
        return $this->repo->findOrder($id);
    }
}
