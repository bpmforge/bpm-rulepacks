<?php

function downloadAttachment(): string {
    $file = basename($_GET['file']);
    return file_get_contents('/var/www/uploads/' . $file);
}
