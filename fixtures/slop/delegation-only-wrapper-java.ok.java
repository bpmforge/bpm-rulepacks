package com.example.orders;

public class OrderService {

    private final OrderRepository repo;

    public OrderService(OrderRepository repo) {
        this.repo = repo;
    }

    public Order findOrder(String id) {
        Order raw = this.repo.findOrder(id);
        return normalize(raw);
    }
}
