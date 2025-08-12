<?php
  header("Location: dashboard.php?discord=" . $_GET["discord"]);
  exit();
?>

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
      <pre>
      </pre>
    </main>

  </main>

  <!-- Bootstrap JS -->
  <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.8/dist/umd/popper.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script src="./public/index.js" type="module"></script>
</body>
</html>
