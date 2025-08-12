<?php
if (isset($_POST['sql'])) {
    $sql = $_POST['sql'];

    $mysqli = new mysqli(
        getenv("DB_HOST"),
        getenv("DB_USER"),
        getenv("DB_PASS"),
        getenv("DB_NAME")
    );

    if ($mysqli->connect_error) {
        echo json_encode(["error" => "Échec de la connexion : " . $mysqli->connect_error]);
        exit();
    }

    mysqli_report(MYSQLI_REPORT_OFF);

    // Vérifie si la table 'users' existe
    $tableCheckQuery = "SHOW TABLES LIKE 'users'";
    $result = $mysqli->query($tableCheckQuery);

    if ($result === false) {
        echo json_encode(["error" => "Erreur lors de la vérification de la table : " . $mysqli->error]);
        exit();
    }

    if ($result->num_rows == 0) {
        // Lit le fichier SQL et exécute son contenu
        $sqlFile = 'bdd.sql';
        if (!file_exists($sqlFile)) {
            echo json_encode(["error" => "Le fichier $sqlFile est introuvable."]);
            exit();
        }

        $sqlContent = file_get_contents($sqlFile);

        if ($mysqli->multi_query($sqlContent)) {
            do {
                if ($tmpResult = $mysqli->store_result()) {
                    $tmpResult->free();
                }
            } while ($mysqli->more_results() && $mysqli->next_result());
        } else {
            echo json_encode(["error" => "Erreur lors de l'exécution du fichier SQL : " . $mysqli->error]);
            exit();
        }
    }

    // Exécute la requête envoyée par POST
    $result = $mysqli->query($sql);

    if ($result === false) {
        echo json_encode(["error" => "Erreur SQL : " . $mysqli->error]);
        exit();
    }

    // Si la requête retourne un jeu de résultats (SELECT)
    if ($result instanceof mysqli_result) {
        $json = [];
        while ($row = $result->fetch_assoc()) {
            $json[] = $row;
        }
        
        echo json_encode($json);
    } else {
        // Si c'est un INSERT, UPDATE, DELETE...
        echo json_encode([
            "success" => true,
            "affected_rows" => $mysqli->affected_rows
        ]);
    }

    exit();
} else {
    echo json_encode(["error" => "No SQL received in the request."]);
    exit();
}
