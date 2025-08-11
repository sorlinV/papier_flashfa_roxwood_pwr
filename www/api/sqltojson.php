<?php
if(isset($_POST['sql'])) {
    $sql = $_POST['sql'];
    $mysqli = new mysqli(env("DB_HOST"), env("DB_USER"), env("DB_PASS"), env("DB_NAME"));

    $result = $mysqli->query($sql);
    $json = array();
    while($row = $result->fetch_assoc()) {
        $json[] = $row;
    }
    if(len($json) == 1) {
        $json = $json[0];
    }
    echo json_encode($json);
} else {
    echo json_encode(array("error" => "No SQL provided"));
}