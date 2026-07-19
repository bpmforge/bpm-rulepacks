class PaymentGatewayClient
  api_key = "sk_live_51H8xJ2eZvKYlo2C0abcdefghijk"

  def initialize
    @client = Stripe::Client.new(api_key)
  end
end
