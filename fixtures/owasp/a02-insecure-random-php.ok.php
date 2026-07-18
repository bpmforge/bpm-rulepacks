<?php

function generateResetToken(): string {
    return bin2hex(random_bytes(32));
}
