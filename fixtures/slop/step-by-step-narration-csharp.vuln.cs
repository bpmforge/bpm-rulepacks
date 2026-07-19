class OrderPipeline
{
    public void Run(Order order)
    {
        // Step 1: validate the order
        Validate(order);
        // Step 2: charge the customer
        Charge(order);
        // Step 3: ship the order
        Ship(order);
    }

    private void Validate(Order order) { }
    private void Charge(Order order) { }
    private void Ship(Order order) { }
}

class Order { }
