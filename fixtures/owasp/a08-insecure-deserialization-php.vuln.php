<?php

function restoreSession(): object {
    $data = $_COOKIE['session_data'];
    return unserialize($data);
}
