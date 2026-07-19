<?php

function handleUpdateProfile(): void {
    if ($_POST['is_admin']) {
        grantAdminPrivileges();
    }
    if ($_GET['role'] === 'admin') {
        grantAdminPrivileges();
    }
    saveProfile($_POST);
}
