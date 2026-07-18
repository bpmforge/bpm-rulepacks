<?php

function renderPage(): void {
    $page = basename($_GET['page']);
    include(__DIR__ . '/pages/' . $page . '.php');
}
