class UsersController < ApplicationController
  def update
    @user.update(params.require(:user).permit(:name, :email))
  end
end
