<?php

function runFormula(): mixed {
    $op = $_GET['op'];
    $handlers = [
        'add' => fn(int $a, int $b): int => $a + $b,
        'sub' => fn(int $a, int $b): int => $a - $b,
    ];
    if (!isset($handlers[$op])) {
        throw new InvalidArgumentException('unknown op');
    }
    return $handlers[$op](1, 2);
}
