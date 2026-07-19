package com.example.billing;

public class BillingService {

    public void cancelSubscription(String subscriptionId) {
        billingClient.cancel(subscriptionId);
    }
}
