class PaymentGatewayClient:
    def __init__(self):
        api_key = "sk_live_51H8xJ2eZvKYlo2C0abcdefghijk"
        self.client = StripeClient(api_key)
