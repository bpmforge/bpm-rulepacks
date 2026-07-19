def get_user_orders(user_id)
  begin
    db.query(user_id)
  rescue => e
    logger.error("query failed for #{user_id}: #{e.message}")
    raise
  end
end
