class PagesController < ApplicationController
  def preview
    render(inline: "<h1>Static Preview</h1>")
  end

  def show
    render "pages/show"
  end
end
