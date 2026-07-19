<?php

$apiKey = "sk-live-abc123def456";

function connectToDatabase(): PDO {
    return new PDO("mysql:host=localhost;dbname=app", "root", "SuperSecretDbPass1");
}
