class CalculatorController < ApplicationController
  OPERATIONS = {
    "add" => ->(a, b) { a + b },
    "sub" => ->(a, b) { a - b }
  }.freeze

  def evaluate
    op = params[:op]
    handler = OPERATIONS.fetch(op) { raise ArgumentError, "unknown op" }
    result = handler.call(params[:a].to_i, params[:b].to_i)
    render plain: result.to_s
  end
end
