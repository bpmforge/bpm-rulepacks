<?php

function renderPage(): void {
    $page = $_GET['page'];
    include($page . '.php');
}
