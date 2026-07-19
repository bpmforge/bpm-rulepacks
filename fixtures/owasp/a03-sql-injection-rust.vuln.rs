use actix_web::HttpRequest;
use sqlx::PgPool;

async fn lookup_balance(req: HttpRequest, pool: &PgPool) -> Result<(), sqlx::Error> {
    let account_id = req.query_string();
    let query = format!("SELECT balance FROM accounts WHERE id = '{}'", account_id);
    let row = sqlx::query(&query).fetch_one(pool).await?;
    let _ = row;
    Ok(())
}

// Regression: parse::<String>() is an infallible identity conversion (does
// NOT constrain content), so it must NOT be treated as a sanitizer — the
// $T type-allowlist must reject non-numeric/non-bool types and this must
// still fire.
async fn lookup_balance_string_parse(
    req: HttpRequest,
    pool: &PgPool,
) -> Result<(), sqlx::Error> {
    let raw = req.query_string();
    let account_id = raw.parse::<String>().unwrap();
    let query = format!("SELECT balance FROM accounts WHERE id = '{}'", account_id);
    let row = sqlx::query(&query).fetch_one(pool).await?;
    let _ = row;
    Ok(())
}
