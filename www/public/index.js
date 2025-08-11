import * as Utils from "./Classes/Utils.js";

Utils.API.get_session("1", Date.now()).then((data) => console.log(data));


document.addEventListener("keydown", function (e) {
    if (e.key === "F5") {
        document.body.innerHTML = "Reloading...";
        setTimeout(()=>{
            location.reload(true);
        }, 200);
    }
})