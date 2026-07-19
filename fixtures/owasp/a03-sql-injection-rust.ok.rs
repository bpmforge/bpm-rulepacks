use actix_web::HttpRequest;
use sqlx::PgPool;

async fn lookup_balance(req: HttpRequest, pool: &PgPool) -> Result<(), sqlx::Error> {
    let account_id = req.query_string();
    let row = sqlx::query("SELECT balance FROM accounts WHERE id = $1")
        .bind(account_id)
        .fetch_one(pool)
        .await?;
    let _ = row;
    Ok(())
}

async fn lookup_balance_by_id_string(
    req: HttpRequest,
    pool: &PgPool,
) -> Result<(), sqlx::Error> {
    let raw = req.query_string();
    // Type-coerced through parse::<i64>() (the pattern-sanitizer) before it
    // is interpolated into the format! string: only decimal digits can
    // survive the round trip, so no SQL metacharacter can reach the sink
    // even though the sanitized value is still built via format!.
    let account_id = raw.parse::<i64>().unwrap_or(0);
    let query = format!("SELECT balance FROM accounts WHERE id = {}", account_id);
    let row = sqlx::query(&query).fetch_one(pool).await?;
    let _ = row;
    Ok(())
}
