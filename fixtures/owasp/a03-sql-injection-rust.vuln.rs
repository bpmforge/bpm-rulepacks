use actix_web::HttpRequest;
use sqlx::PgPool;

async fn lookup_balance(req: HttpRequest, pool: &PgPool) -> Result<(), sqlx::Error> {
    let account_id = req.query_string();
    let query = format!("SELECT balance FROM accounts WHERE id = '{}'", account_id);
    let row = sqlx::query(&query).fetch_one(pool).await?;
    let _ = row;
    Ok(())
}
