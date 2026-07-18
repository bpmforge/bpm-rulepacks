<?php

function generateResetToken(): string {
    return md5(uniqid(rand(), true));
}
