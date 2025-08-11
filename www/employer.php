<?php include("includes/verif_user.php") ?>
<!DOCTYPE html>
<html lang="fr">
<head>
  <?php include("includes/head.php") ?>
</head>
<body>

  <!-- Aside -->
  <aside class="d-flex flex-column p-3">
    <h2 class="text-white fs-4 mb-4">
      <i class="mdi mdi-factory"></i> Roxwood PWD
    </h2>
    <?php include("includes/aside.php") ?>
  </aside>

  <!-- Main Content -->
  <main class="d-flex flex-column">
    
    <!-- Header -->
    <?php include("includes/header.php") ?>

    <!-- Page Content -->
    <main style="background-color: #f8f9fa;">


    <div class="container">
      <h2 class="mb-4"><i class="mdi mdi-account-group"></i> Liste des Employés</h2>
      <div class="table-responsive">
        <table class="table table-dark table-hover table-bordered align-middle" style="font-size: 0.7em;">
          <thead class="table-primary text-dark">
            <tr>
              <th>Date d'arrivée</th>
              <th>Matricules</th>
              <th>Nom - ID</th>
              <th>Tel</th>
              <th>IBAN</th>
              <th>Grade</th>
              <th>Avertissement</th>
              <th>Bouteille d'essence</th>
              <th>Bidon pétrole de synt</th>
              <th>Bidon d'essence</th>
              <th>Livraison</th>
              <th>quota actuel</th>
              <th>Salaire brut (max par grade)</th>
              <th>Frais essence</th>
              <th>Salaire total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>2023-01-01</td>
              <td>12345678</td>
              <td>John Doe</td>
              <td>1234567890</td>
              <td>251455</td>
              <td>Novice</td>
              <td>0</td>
              <td>0</td>
              <td>0</td>
              <td>0</td>
              <td>0</td>
              <td>500</td>
              <td>0</td>
              <td>500</td>
              <td>500</td>
            </tr>            <!-- D'autres lignes ici -->
          </tbody>
        </table>
      </div>
    </div>

    </main>

  </main>

  <!-- Bootstrap JS -->
  <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.8/dist/umd/popper.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script src="./public/index.js" type="module"></script>
</body>
</html>
