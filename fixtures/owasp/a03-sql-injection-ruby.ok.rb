class UsersController < ApplicationController
  def show
    user_id = params[:id]
    result = ActiveRecord::Base.connection.execute(
      ActiveRecord::Base.sanitize_sql_array(["SELECT * FROM users WHERE id = ?", user_id])
    )
    render json: result.first
  end
end
