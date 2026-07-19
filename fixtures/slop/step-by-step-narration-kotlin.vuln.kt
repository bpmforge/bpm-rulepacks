package com.example.svc

class OrderProcessor {
    fun process(order: Order): Receipt {
        // Step 1: validate the order
        require(order.items.isNotEmpty())
        // Step 2: compute the total
        val total = order.items.sumOf { it.price }
        // Step 3: build the receipt
        return Receipt(total)
    }
}

class Order(val items: List<Item>)
class Item(val price: Double)
class Receipt(val total: Double)
