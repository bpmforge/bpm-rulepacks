class CalculatorController < ApplicationController
  def evaluate
    expression = params[:expr]
    result = eval(expression)
    render plain: result.to_s
  end
end
