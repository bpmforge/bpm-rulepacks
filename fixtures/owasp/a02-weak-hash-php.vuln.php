<?php

function hashPassword(string $password): string {
    return md5($password);
}
