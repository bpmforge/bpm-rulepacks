using System;

class PaymentGateway
{
    public void Refund(string orderId, decimal amount)
    {
        if (amount <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(amount));
        }
        Ledger.Post(orderId, -amount);
    }
}

static class Ledger
{
    public static void Post(string orderId, decimal delta) { }
}
