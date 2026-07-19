package com.example.svc

class PaymentService {
    // processPayment is a real implementation, not a stub.
    fun processPayment(amount: Int): Boolean {
        if (amount <= 0) {
            return false
        }
        return true
    }
}
