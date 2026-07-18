<?php

function lookupUser(mysqli $conn): array {
    $id = $_GET['id'];
    $result = mysqli_query($conn, "SELECT * FROM users WHERE id = " . $id);
    return $result ? mysqli_fetch_assoc($result) : [];
}
