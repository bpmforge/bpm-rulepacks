class ApiController < ApplicationController
  def call
    method_name = params[:action_name]
    obj.send(method_name)
  end
end
