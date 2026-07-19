class BackupController < ApplicationController
  def export
    filename = params[:filename]
    system("tar -czf /backups/#{filename}.tar.gz /data")
    render plain: "queued"
  end
end
