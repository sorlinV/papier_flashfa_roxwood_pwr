<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Roxwood PWD</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/@mdi/font/css/materialdesignicons.min.css" rel="stylesheet">
<link href="./public/style.css" rel="stylesheet">
<script src="md5.min.js"></script>
<script>
    document.addEventListener("keydown", function (e) {
        if (e.key === "F5") {
            document.body.innerHTML = "Reloading...";
            setTimeout(()=>{
                location.reload(true);
            }, 200);
        }
    })
</script>