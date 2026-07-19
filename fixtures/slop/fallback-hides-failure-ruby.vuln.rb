def get_user_orders(user_id)
  begin
    db.query(user_id)
  rescue => e
    []
  end
end
