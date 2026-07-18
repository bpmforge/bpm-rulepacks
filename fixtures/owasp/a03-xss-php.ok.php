<?php

function renderComment(): void {
    $comment = $_POST['comment'];
    echo htmlspecialchars($comment, ENT_QUOTES, 'UTF-8');
}
