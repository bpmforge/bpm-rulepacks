def process_all(items)
  results = []
  begin
    items.each do |item|
      results << transform(item)
    end
  rescue => e
    logger.error("transform failed: #{e.message}")
    raise
  end
  results
end
