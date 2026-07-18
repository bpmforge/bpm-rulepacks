class ApiController < ApplicationController
  ALLOWED_ACTIONS = { "activate" => :activate!, "deactivate" => :deactivate! }.freeze

  def call
    method_name = params[:action_name]
    action = ALLOWED_ACTIONS.fetch(method_name)
    obj.send(action)
  end
end
