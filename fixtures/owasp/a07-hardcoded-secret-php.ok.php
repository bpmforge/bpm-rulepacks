<?php

$apiKey = getenv('STRIPE_API_KEY');

function connectToDatabase(): PDO {
    return new PDO("mysql:host=localhost;dbname=app", getenv('DB_USER'), getenv('DB_PASSWORD'));
}
