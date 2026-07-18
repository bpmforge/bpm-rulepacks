<?php

function pingHost(): string {
    $host = escapeshellarg($_GET['host']);
    return shell_exec("ping -c 1 $host");
}
