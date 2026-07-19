package com.example.svc

class OrderProcessor {
    fun process(order: Order): Receipt {
        require(order.items.isNotEmpty()) { "order must have at least one item" }
        val total = order.items.sumOf { it.price }
        return Receipt(total)
    }
}

class Order(val items: List<Item>)
class Item(val price: Double)
class Receipt(val total: Double)
