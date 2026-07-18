<?php

function downloadAttachment(): string {
    $file = $_GET['file'];
    return file_get_contents('/var/www/uploads/' . $file);
}
