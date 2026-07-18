<?php

function runFormula(): mixed {
    $expr = $_GET['expr'];
    return eval("return $expr;");
}
