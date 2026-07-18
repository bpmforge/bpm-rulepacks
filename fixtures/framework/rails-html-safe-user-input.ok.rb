class CommentsController < ApplicationController
  def show
    @rendered = "<p>Static welcome message</p>".html_safe
  end
end
