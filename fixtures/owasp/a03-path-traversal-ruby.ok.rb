class DocumentsController < ApplicationController
  def show
    filename = File.basename(params[:filename])
    content = File.read("/var/app/uploads/#{filename}")
    render plain: content
  end
end
