<?php

function handleUpdateProfile(): void {
    if ($_SESSION['user']->hasRole('admin')) {
        grantAdminPrivileges();
    }
    saveProfile($_POST);
}
