import os


class PaymentGatewayClient:
    def __init__(self):
        api_key = os.environ["STRIPE_API_KEY"]
        self.client = StripeClient(api_key)
