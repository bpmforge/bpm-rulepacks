class PaymentGatewayClient
  def initialize
    api_key = ENV.fetch("STRIPE_API_KEY")
    @client = Stripe::Client.new(api_key)
  end
end
