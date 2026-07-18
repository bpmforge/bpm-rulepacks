<?php

function restoreSession(): array {
    $data = $_COOKIE['session_data'];
    return json_decode($data, true) ?? [];
}
