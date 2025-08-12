import * as Utils from "./Classes/Utils.js";


await Utils.API.add_user("162613553516249088", "123", "John Doe", Utils.GRADE.directeur);

let session = null;
Utils.API.get_session().then((user) => {
    if(user.err != null) {
        console.log(user);
        return;
    }
    session = user;
    document.body.style.display = "flex";
    for (const user_name_elem of document.querySelectorAll(".user_name")) {
        user_name_elem.innerHTML = user.name;
    }
    
    let event = new CustomEvent('session_loaded');

    // Dispatch the event
    document.dispatchEvent(event);
});

class DeclarationForm extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        if(session == null) {
            document.addEventListener("session_loaded", () => {
                this.connectedCallback();
            });
            return;
        }

        let select = Utils.htmlToArrayElement(`
            <select class="form-select" id="type" name="type" required>
            </select>
        `)[0];
        if(session.grade > Utils.GRADE.manager) {
            let options = Utils.htmlToArrayElement(`
                <option value="bouteille_essence">Bouteille Essence</option>
                <option value="bidon_sythese">Bidon Synthèse</option>
                <option value="bidon_essence">Bidon Essence</option>
                <option value="livraison">Livraison</option>
            `)
            select.append(...options);
        } else if (session.grade >= Utils.GRADE.recolte_novice && session.grade <= Utils.GRADE.recolte_confirme) {
            let options = Utils.htmlToArrayElement(`
                <option value="bouteille_essence">Bouteille Essence</option>
            `)
            select.append(...options);
        } else if (session.grade >= Utils.GRADE.production_novice && session.grade <= Utils.GRADE.production_expert) {
            let options = Utils.htmlToArrayElement(`
                <option value="bidon_sythese">Bidon Synthèse</option>
                <option value="bidon_essence">Bidon Essence</option>
            `)
            select.append(...options);
        } else if (session.grade >= Utils.GRADE.livreur_novice && session.grade <= Utils.GRADE.livreur_expert) {
            let options = Utils.htmlToArrayElement(`
                <option value="livraison">Livraison</option>
            `)
            select.append(...options);
        }
        let options = Utils.htmlToArrayElement(`
            <option value="frais">Frais Essence</option>
        `)
        select.append(...options)

        let elems = Utils.htmlToArrayElement(`
            <form id="declarationForm">
                <input type="hidden" id="user_id" name="user_id" value="123" />

                <div id="types" class="mb-3">
                    <label for="type" class="form-label">Type de déclaration <i class="mdi mdi-format-list-bulleted"></i></label>
                </div>

                <div class="mb-3" id="quantiteGroup">
                <label for="quantite" class="form-label">Quantité ou Somme<i class="mdi mdi-counter"></i></label>
                <input type="number" class="form-control" id="quantite" name="quantite" min="1"/>
                </div>

                <div class="mb-3 d-none" id="lieuGroup">
                    <label for="lieu" class="form-label">Lieu <i class="mdi mdi-map-marker"></i></label>
                    <select id="lieux" class="form-select" id="lieu" name="lieu">
                        <option value="" selected disabled>Choisir un lieu</option>
                    </select>
                </div>

                <div class="mb-3 d-none" id="imageGroup">
                    <label for="image" class="form-label">Image <i class="mdi mdi-camera"></i></label>
                    <input type="file" class="form-control" id="image" name="image" accept="image/*" />
                </div>

                <button type="submit" class="btn btn-primary">
                <i class="mdi mdi-send"></i> Envoyer la déclaration
                </button>
            </form>`
        );
        this.append(...elems);
        this.types = this.querySelector('#types');
        this.types.appendChild(select);
        
        this.lieux = this.querySelector('#lieux');
        for (const [key, value] of Object.entries(Utils.LTD)) {
            let option = document.createElement('option');
            option.value = value;
            option.textContent = key;
            this.lieux.appendChild(option);
        }

        this.typeSelect = this.querySelector('#type');
        this.lieuGroup = this.querySelector('#lieuGroup');
        this.imageGroup = this.querySelector('#imageGroup');

        this.typeSelect.addEventListener('change', this.updateVisibility.bind(this));

        this.form = this.querySelector('#declarationForm');
        this.form.addEventListener('submit', (event) => {
            event.preventDefault();
            let formData = new FormData(this.form);
            Utils.API.add_declaration(session.id, this.typeSelect.value, formData.get('quantite'), formData.get('lieu'), ).then((data) => {
                console.log(data);
            });
        });

        this.updateVisibility();
    }
    updateVisibility() {
            const selectedType = this.typeSelect.value;

            // Réinitialiser tout à caché sauf quantite qui est toujours visible
            this.lieuGroup.classList.add('d-none');
            this.imageGroup.classList.add('d-none');

            if (selectedType === 'livraison') {
                this.lieuGroup.classList.remove('d-none');
            } else if (selectedType === 'frais') {
                this.imageGroup.classList.remove('d-none');
            }
        }
}
class UsersWeekTable extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.renderLoading();
    this.loadData()
      .then(data => {
        console.log(data);
        this.renderTable(data);
      })
      .catch(error => {
        this.innerHTML = `<p class="text-danger">Erreur lors du chargement des données : ${error.message}</p>`;
      });
  }

  renderLoading() {
    this.innerHTML = `<p class="text-muted">Chargement des données...</p>`;
  }

  loadData() {
    const dateAttr = this.getAttribute("date");
    const date = dateAttr ? new Date(dateAttr) : new Date();
    return Utils.API.get_users_data_for_week(date);
  }

  renderTable(data) {
    const gradeMap = {
      1: "Recolte Novice",
      2: "Recolte Confirmé",
      3: "Recolte Expert",
      4: "Production Novice",
      5: "Production Confirmé",
      6: "Production Expert",
      7: "Livreur Novice",
      8: "Livreur Confirmé",
      9: "Livreur Expert",
      10: "Manager",
      11: "DRH",
      12: "Co-Directeur",
      13: "Directeur"
    };

    function salaireBrutMax(gradeId) {
      const salaireMap = {
        1: 1000,
        2: 1200,
        3: 1400,
        4: 1500,
        5: 1700,
        6: 1900,
        7: 1300,
        8: 1500,
        9: 1700,
        10: 2500,
        11: 3000,
        12: 3500,
        13: 4000
      };
      return salaireMap[gradeId] || 0;
    }

    function salaireTotal(salaireBrut, fraisEssence) {
      return salaireBrut + (parseFloat(fraisEssence) || 0);
    }

    const rows = data.map(user => {
      const gradeId = user.grade;
      const salaireBrut = salaireBrutMax(gradeId);
      const fraisEssence = user.frais_essence || 0;
      const salaireTot = salaireTotal(salaireBrut, fraisEssence);

      return `
        <tr>
          <td>${new Date(user.date_entree).toISOString().slice(0, 10)} <i class="mdi mdi-calendar"></i></td>
          <td>${user.matricule || ""}</td>
          <td>${user.name || ""} <i class="mdi mdi-account"></i></td>
          <td>${user.tel || ""} <i class="mdi mdi-phone"></i></td>  
          <td>${user.iban || ""} <i class="mdi mdi-bank"></i></td>  
          <td>${gradeMap[gradeId] || gradeId} <i class="mdi mdi-account-badge"></i></td>
          <td>${user.avertissements || 0} <i class="mdi mdi-alert-circle-outline"></i></td>
          <td>${user.bouteille_essence || 0} <i class="mdi mdi-gas-station"></i></td>
          <td>${user.bidon_petrole_synt || 0} <i class="mdi mdi-oil"></i></td>
          <td>${user.bidon_essence || 0} <i class="mdi mdi-fuel"></i></td>
          <td>${user.livraison || 0} <i class="mdi mdi-truck-delivery"></i></td>
          <td>${user.quota_actuel || 0} <i class="mdi mdi-chart-bar"></i></td>
          <td>${salaireBrut}<i class="mdi mdi-currency-eur"></i></td>
          <td>${fraisEssence} € <i class="mdi mdi-gas-station"></i></td>
          <td>${salaireTot.toFixed(2)} € <i class="mdi mdi-cash-multiple"></i></td>
        </tr>
      `;
    }).join("");

    this.innerHTML = `
      <div class="table-responsive">
        <table class="table table-striped table-hover table-bordered align-middle" style="font-size: 0.5rem">
          <thead class="table-primary text-dark">
            <tr>
              <th>Date d'arrivée <i class="mdi mdi-calendar"></i></th>
              <th>Matricules</th>
              <th>Nom - ID <i class="mdi mdi-account"></i></th>
              <th>Tel <i class="mdi mdi-phone"></i></th>
              <th>IBAN <i class="mdi mdi-bank"></i></th>
              <th>Grade <i class="mdi mdi-account-badge"></i></th>
              <th>Avertissement <i class="mdi mdi-alert-circle-outline"></i></th>
              <th>Bouteille d'essence <i class="mdi mdi-gas-station"></i></th>
              <th>Bidon pétrole de synt <i class="mdi mdi-oil"></i></th>
              <th>Bidon d'essence <i class="mdi mdi-fuel"></i></th>
              <th>Livraison <i class="mdi mdi-truck-delivery"></i></th>
              <th>Quota actuel <i class="mdi mdi-chart-bar"></i></th>
              <th>Salaire brut (max par grade) <i class="mdi mdi-currency-eur"></i></th>
              <th>Frais essence <i class="mdi mdi-gas-station"></i></th>
              <th>Salaire total <i class="mdi mdi-cash-multiple"></i></th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }
}

customElements.define("users-week-table", UsersWeekTable);
class DeliveryWeekTable extends HTMLElement {
  constructor() {
    super();
    this.unitPrice = 37.5;
  }

  connectedCallback() {
    const dateStr = this.getAttribute('date') || new Date().toISOString();
    const date = new Date(dateStr);

    this.renderLoading();

    Utils.API.get_deliveries_per_ltd_week(date).then(data => {
      this.renderTable(data);
    }).catch(err => {
      this.innerHTML = `<p class="text-danger">Erreur lors du chargement : ${err}</p>`;
    });
  }

  renderLoading() {
    this.innerHTML = `<p class="text-muted">Chargement des livraisons globales...</p>`;
  }

  renderTable(data) {
    const allLtds = Object.keys(Utils.LTD);
    const deliveriesByLtd = {};
    data.forEach(row => {
      deliveriesByLtd[row.ltd] = row.total_livraisons || 0;
    });

    const rows = allLtds.map(ltdName => {
      const qty = deliveriesByLtd[ltdName] || 0;
      const priceTotal = (qty * this.unitPrice).toFixed(2);
      return `
        <tr>
          <td>${ltdName}</td>
          <td class="text-center">${qty}</td>
          <td class="text-center">${this.unitPrice.toFixed(2)} €</td>
          <td class="text-center">${priceTotal} €</td>
        </tr>
      `;
    }).join('');

    this.innerHTML = `
      <div class="table-responsive">
        <table class="table table-hover table-bordered align-middle">
          <thead class="table-primary">
            <tr>
              <th>LTD <i class="mdi mdi-domain"></i></th>
              <th>Total Livraisons <i class="mdi mdi-truck-delivery"></i></th>
              <th>Prix Unitaire <i class="mdi mdi-currency-eur"></i></th>
              <th>Prix Total <i class="mdi mdi-cash-multiple"></i></th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }
}

customElements.define('delivery-week-table', DeliveryWeekTable);
customElements.define("users-week-table", UsersWeekTable);
customElements.define('declaration-form', DeclarationForm);


document.addEventListener("keydown", function (e) {
    if (e.key === "F5") {
        document.body.innerHTML = "Reloading...";
        setTimeout(()=>{
            location.reload(true);
        }, 200);
    }
})
