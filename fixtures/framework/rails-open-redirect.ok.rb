class SessionsController < ApplicationController
  def create
    redirect_to(root_path, allow_other_host: false)
  end
end
