def process_all(items)
  results = []
  items.each do |item|
    begin
      results << transform(item)
    rescue => e
      results << nil
    end
  end
  results
end
