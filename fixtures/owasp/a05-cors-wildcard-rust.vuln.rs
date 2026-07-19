use actix_cors::Cors;
use actix_web::HttpResponse;

fn build_cors() -> Cors {
    Cors::permissive()
}

async fn status() -> HttpResponse {
    HttpResponse::Ok()
        .insert_header(("Access-Control-Allow-Origin", "*"))
        .body("ok")
}

async fn status_append() -> HttpResponse {
    HttpResponse::Ok()
        .append_header(("Access-Control-Allow-Origin", "*"))
        .body("ok")
}

fn _use(_cors: Cors) {}
