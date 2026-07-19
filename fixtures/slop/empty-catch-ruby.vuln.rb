def load_config(path)
  begin
    File.read(path)
  rescue => e
  end
end
