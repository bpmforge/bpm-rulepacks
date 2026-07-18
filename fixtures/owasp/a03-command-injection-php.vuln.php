<?php

function pingHost(): string {
    $host = $_GET['host'];
    $cmd = "ping -c 1 " . $host;
    return `$cmd`;
}
