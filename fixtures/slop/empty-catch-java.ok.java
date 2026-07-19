package com.example.orders;

public class OrderProcessor {

    public void process(Order order) {
        try {
            submit(order);
        } catch (Exception e) {
            log.error("order submission failed: {}", order.getId(), e);
            throw new OrderProcessingException(order.getId(), e);
        }
    }

    private void submit(Order order) throws Exception {
        // dispatch to the payment gateway
    }
}
