class UsersController < ApplicationController
  def update
    @user.update(params.require(:user).permit!)
  end
end
