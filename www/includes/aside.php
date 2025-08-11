<nav class="nav flex-column">
    <a href="dashboard.php?user=<?= $_GET["user"] ?>" class="nav-link"><i class="mdi mdi-view-dashboard"></i> Dashboard</a>
    <a href="employer.php?user=<?= $_GET["user"] ?>" class="nav-link"><i class="mdi mdi-account-group"></i> Employés</a>
    <a href="livraisons.php?user=<?= $_GET["user"] ?>" class="nav-link"><i class="mdi mdi-truck-delivery"></i> Livraisons</a>
    <a href="salaires.php?user=<?= $_GET["user"] ?>" class="nav-link"><i class="mdi mdi-cash-multiple"></i> Salaires</a>
    <a href="factures.php?user=<?= $_GET["user"] ?>" class="nav-link"><i class="mdi mdi-file-document"></i> Factures</a>
    <a href="declaration.php?user=<?= $_GET["user"] ?>" class="nav-link"><i class="mdi mdi-clipboard-text"></i> Déclarations</a>
</nav>