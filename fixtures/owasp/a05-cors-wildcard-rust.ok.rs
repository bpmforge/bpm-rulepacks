use actix_cors::Cors;
use actix_web::HttpResponse;

fn build_cors() -> Cors {
    Cors::default()
        .allowed_origin("https://app.example.com")
        .allowed_methods(vec!["GET", "POST"])
}

async fn status() -> HttpResponse {
    HttpResponse::Ok()
        .insert_header(("Access-Control-Allow-Origin", "https://app.example.com"))
        .body("ok")
}

async fn status_append() -> HttpResponse {
    HttpResponse::Ok()
        .append_header(("Access-Control-Allow-Origin", "https://app.example.com"))
        .body("ok")
}

fn _use(_cors: Cors) {}
