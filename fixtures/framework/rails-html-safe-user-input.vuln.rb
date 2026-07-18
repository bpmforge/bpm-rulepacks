class CommentsController < ApplicationController
  def show
    @rendered = @comment.body.html_safe
  end
end
