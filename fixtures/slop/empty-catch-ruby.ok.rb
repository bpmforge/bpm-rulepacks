require "logger"

logger = Logger.new($stdout)

def load_config(path)
  begin
    File.read(path)
  rescue => e
    logger.error("failed to load config #{path}: #{e.message}")
    raise
  end
end
