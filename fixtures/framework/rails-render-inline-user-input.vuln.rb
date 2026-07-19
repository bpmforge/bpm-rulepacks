class PagesController < ApplicationController
  def preview
    template = params[:template]
    render(inline: template)
  end
end
