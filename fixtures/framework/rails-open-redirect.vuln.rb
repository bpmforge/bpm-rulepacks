class SessionsController < ApplicationController
  def create
    redirect_to(params[:next])
  end
end
