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
