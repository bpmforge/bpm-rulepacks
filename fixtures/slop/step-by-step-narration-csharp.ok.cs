class OrderPipeline
{
    public void Run(Order order)
    {
        ValidateOrder(order);
        ChargeCustomer(order);
        ShipOrder(order);
    }

    // Charges must run after validation succeeds so a rejected order never
    // reaches the payment gateway.
    private void ValidateOrder(Order order) { }
    private void ChargeCustomer(Order order) { }
    private void ShipOrder(Order order) { }
}

class Order { }
