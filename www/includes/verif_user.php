<?php
    if(!isset($_GET["user"])) {
        header("Location: login.php");
        exit();
    }
    $path = "./data/users/" . $_GET["user"] . ".json";
    if(!file_exists($path)) {
        header("Location: login.php?err='usernotfound'");
        exit();
    }
    $user = json_decode(file_get_contents($path), true);
?>