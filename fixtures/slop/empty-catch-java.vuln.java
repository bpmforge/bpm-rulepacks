package com.example.orders;

public class OrderProcessor {

    public void process(Order order) {
        try {
            submit(order);
        } catch (Exception e) {
        }
    }

    private void submit(Order order) throws Exception {
        // dispatch to the payment gateway
    }
}
