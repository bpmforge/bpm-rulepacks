class UsersController < ApplicationController
  def show
    user_id = params[:id]
    result = ActiveRecord::Base.connection.execute("SELECT * FROM users WHERE id = #{user_id}")
    render json: result.first
  end
end
