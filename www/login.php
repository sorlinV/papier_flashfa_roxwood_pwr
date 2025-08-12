
<?php if (isset($_GET["err"])) { ?>
<script>
localStorage.removeItem('auth_code');
</script>
<?php } ?><!DOCTYPE html>
<html lang="fr">
<head>
    <?php include("includes/head.php") ?>
</head>
<body class="bg-light">
<div class="container">
    <div class="row justify-content-center mt-5">
        <div class="col-md-4">
            <div class="card shadow">
                <div class="card-header text-center">Connexion</div>
                <div class="card-body">
                    <?php if (isset($_GET["err"])) { ?>
                        <div class="alert alert-danger" role="alert">
                            <?= $_GET["err"] ?>
                        </div>
                    <?php } ?>
                    <form id="loginForm">
                        <div class="mb-3">
                            <label for="username" class="form-label">Utilisateur</label>
                            <input type="text" class="form-control" id="username" required>
                        </div>
                        <div class="mb-3">
                            <label for="password" class="form-label">Mot de passe</label>
                            <input type="password" class="form-control" id="password">
                        </div>
                        <button type="submit" class="btn btn-primary w-100">Se connecter</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
// Si auth déjà présent, redirige vers os.php
if (localStorage.getItem('auth_code')) {
    window.location.href = 'index.php?discord=' + localStorage.getItem('auth_code');
}

// Gestion du formulaire
document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    localStorage.setItem('auth_code', "162613553516249088");

    // Redirige vers os.php
    window.location.href = 'index.php?discord=' + authCode;
});
</script>
</body>
</html>
