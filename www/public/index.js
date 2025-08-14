import * as Utils from "./Classes/Utils.js";

await Utils.API.add_user("162613553516249088", 150, "193-7012", "STEVE", "Steven MOFFAT", Utils.GRADE.manager);

let session = null;
Utils.API.get_session().then((user) => {
    user = user[0];
    if(user.err != null) {
        return;
    }
    session = user;
    document.body.style.display = "flex";
    for (let user_name_elem of document.querySelectorAll(".user_name")) {
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
        if (typeof session === 'undefined' || session == null) {
            document.addEventListener("session_loaded", () => {
                this.connectedCallback();
            }, { once: true });
            return;
        }


        let select = Utils.htmlToArrayElement(`
            <select class="form-select" id="type" name="type" required>
            </select>
        `)[0];
        if(session.grade >= Utils.GRADE.manager) {
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
            Utils.API.add_declaration(session.id, this.typeSelect.value, formData.get('quantite'), formData.get('lieu') || 0).then((data) => {
                window.location.reload(true);
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
    this.currentDate = null;
  }

  connectedCallback() {
    if (typeof session === 'undefined' || session == null) {
        document.addEventListener("session_loaded", () => {
            this.connectedCallback();
        }, { once: true });
        return;
    }
    
    // Initialiser la date courante
    const dateAttr = this.getAttribute("date");
    this.currentDate = dateAttr ? new Date(dateAttr) : new Date();
    this.currentDate = this.getMondayOfWeek(this.currentDate);
    
    this.renderLoading();
    this.loadData()
      .then(data => {
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
    return Utils.API.get_users_data_for_week(this.currentDate);
  }

  // Fonction pour obtenir le numéro de semaine
  getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  // Fonction pour obtenir le lundi de la semaine
  getMondayOfWeek(date) {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Ajuster pour que lundi soit le premier jour
    return new Date(date.setDate(diff));
  }

  // Fonction pour obtenir le dimanche de la semaine
  getSundayOfWeek(date) {
    const monday = this.getMondayOfWeek(new Date(date));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return sunday;
  }

  // Navigation vers la semaine précédente
  previousWeek() {
    this.currentDate = new Date(this.currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    this.renderLoading();
    this.loadData()
      .then(data => {
        this.renderTable(data);
      })
      .catch(error => {
        this.innerHTML = `<p class="text-danger">Erreur lors du chargement des données : ${error.message}</p>`;
      });
  }

  // Navigation vers la semaine suivante
  nextWeek() {
    console.log(new Date(this.currentDate.getTime()) + "\n" + new Date(this.currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    this.currentDate = new Date(this.currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    this.renderLoading();
    this.loadData()
      .then(data => {
        this.renderTable(data);
      })
      .catch(error => {
        this.innerHTML = `<p class="text-danger">Erreur lors du chargement des données : ${error.message}</p>`;
      });
  }

  // Retour à la semaine courante
  goToCurrentWeek() {
    this.currentDate = new Date();
    this.renderLoading();
    this.loadData()
      .then(data => {
        this.renderTable(data);
      })
      .catch(error => {
        this.innerHTML = `<p class="text-danger">Erreur lors du chargement des données : ${error.message}</p>`;
      });
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

    function salaireMaxGet(gradeId) {
      const salaireMap = {
        1: 15000,
        2: 15000,
        3: 15000,
        4: 15000,
        5: 15000,
        6: 15000,
        7: 15000,
        8: 15000,
        9: 15000,
        10: 15000,
        11: 15000,
        12: 15000,
        13: 15000
      };
      return salaireMap[gradeId] || 0;
    }

    function salaireTotal(salaireMax, fraisEssence) {
      return salaireMax + (parseFloat(fraisEssence) || 0);
    }

    // Calculer les informations de la semaine
    const weekNumber = this.getWeekNumber(this.currentDate);
    const monday = this.getMondayOfWeek(this.currentDate);
    const sunday = this.getSundayOfWeek(this.currentDate);
    const year = this.currentDate.getFullYear();

    const rows = data.map(user => {
      const gradeId = user.grade;
      const salaireMax = salaireMaxGet(gradeId);
      const fraisEssence = user.frais_essence || 0;
      const quota = (user.bouteille_essence * (salaireMax / 7000)) + (user.bidon_essence * (salaireMax / 4000)) + (user.bidon_petrole_synt * (salaireMax / 3200)) + (user.livraison * (salaireMax / 3200));
      const quota_clamp = Math.min(quota, salaireMax);
      const restant = quota - quota_clamp;
      const salaireTot = salaireTotal(quota_clamp, fraisEssence);
      return `
        <tr>
          <td class="${this.getAttribute("is_salaire") == "true" ? "d-none" : ""}" >${new Date(user.date_entree).toISOString().slice(0, 10)} <i class="mdi mdi-calendar"></i></td>
          <td class="${this.getAttribute("is_salaire") == "true" ? "d-none" : ""}" >${user.matricule || ""}</td>
          <td>${user.name || ""} <i class="mdi mdi-account"></i></td>
          <td class="${this.getAttribute("is_salaire") == "true" ? "d-none" : ""}" >${user.tel || ""} <i class="mdi mdi-phone"></i></td>  
          <td >${user.IBAN || ""} <i class="mdi mdi-bank"></i></td>  
          <td class="${this.getAttribute("is_salaire") == "true" ? "d-none" : ""}" >${gradeMap[gradeId] || gradeId} <i class="mdi mdi-account-badge"></i></td>
          <td class="${this.getAttribute("is_salaire") == "true" ? "d-none" : ""}" >${user.avertissements || 0} <i class="mdi mdi-alert-circle-outline"></i></td>
          <td class="${this.getAttribute("is_salaire") != "true" ? "d-none" : ""}" >${user.bouteille_essence || 0} <i class="mdi mdi-gas-station"></i></td>
          <td class="${this.getAttribute("is_salaire") != "true" ? "d-none" : ""}" >${user.bidon_petrole_synt || 0} <i class="mdi mdi-oil"></i></td>
          <td class="${this.getAttribute("is_salaire") != "true" ? "d-none" : ""}" >${user.bidon_essence || 0} <i class="mdi mdi-fuel"></i></td>
          <td class="${this.getAttribute("is_salaire") != "true" ? "d-none" : ""}" >${user.livraison || 0} <i class="mdi mdi-truck-delivery"></i></td>
          <td class="${this.getAttribute("is_salaire") != "true" ? "d-none" : ""}" >${quota.toFixed(2)} <i class="mdi mdi-chart-bar"></i></td>
          <td class="${this.getAttribute("is_salaire") != "true" ? "d-none" : ""}" >${salaireMax}<i class="mdi mdi-currency-eur"></i></td>
          <td class="${this.getAttribute("is_salaire") != "true" ? "d-none" : ""}" >${restant.toFixed(2)}<i class="mdi mdi-currency-eur"></i></td>
          <td class="${this.getAttribute("is_salaire") != "true" ? "d-none" : ""}" >${fraisEssence} € <i class="mdi mdi-gas-station"></i></td>
          <td class="${this.getAttribute("is_salaire") != "true" ? "d-none" : ""}" >${salaireTot.toFixed(2)}<i class="mdi mdi-currency-eur"></i></td>
          <td class="${this.getAttribute("is_salaire") == "true" || session.grade < 10 ? "d-none" : ""}" ><user-form discord_id="${user.discord_id}"></user-form></td>
          <td class="${this.getAttribute("is_salaire") == "true" || session.grade < 10 ? "d-none" : ""}" ><user-delete discord_id="${user.discord_id}"></user-delete></td>
        </tr>
      `;
    }).join("");

    this.innerHTML = `
      <div class="table-responsive">
        <table class="table table-striped table-hover table-bordered align-middle" style="font-size: 0.8rem">
          <!-- Header des colonnes -->
          <thead class="table-dark text-dark">
            <tr class="${this.getAttribute("is_salaire") != "true" ? "d-none" : ""}">
              <th colspan="${this.getAttribute("is_salaire") == "true" ? "11" : "9"}" class="p-3">
                <div class="d-flex justify-content-between align-items-center">
                  <div class="d-flex gap-2">
                    <button type="button" class="btn btn-outline-light btn-sm" id="previous-week">
                      <i class="mdi mdi-chevron-left"></i> Semaine précédente
                    </button>
                    <button type="button" class="btn btn-light btn-sm" id="current-week">
                      <i class="mdi mdi-calendar-today"></i> Semaine actuelle
                    </button>
                    <button type="button" class="btn btn-outline-light btn-sm" id="next-week">
                      Semaine suivante <i class="mdi mdi-chevron-right"></i>
                    </button>
                  </div>
                  <div class="text-light fw-bold">
                    <i class="mdi mdi-calendar-week"></i> Semaine ${weekNumber} - ${year}
                    <br>
                    <small class="text-light opacity-75">
                      Du ${monday.toLocaleDateString('fr-FR')} au ${sunday.toLocaleDateString('fr-FR')}
                    </small>
                  </div>
                </div>
              </th>
            </tr>
            <tr>
              <th class="${this.getAttribute("is_salaire") == "true" ? "d-none" : ""}" title="Date d'arrivée">Date d'arrivée <i class="mdi mdi-calendar"></i></th>
              <th class="${this.getAttribute("is_salaire") == "true" ? "d-none" : ""}" title="Matricules">Matricules</th>
              <th  title="Nom">Nom<i class="mdi mdi-account"></i></th>
              <th class="${this.getAttribute("is_salaire") == "true" ? "d-none" : ""}" title="Tel">Tel <i class="mdi mdi-phone"></i></th>
              <th title="IBAN">IBAN <i class="mdi mdi-bank"></i></th>
              <th class="${this.getAttribute("is_salaire") == "true" ? "d-none" : ""}" title="Grade">Grade <i class="mdi mdi-account-badge"></i></th>
              <th class="${this.getAttribute("is_salaire") == "true" ? "d-none" : ""}" title="Avertissements">Avertissement <i class="mdi mdi-alert-circle-outline"></i></th>
              <th class="${this.getAttribute("is_salaire") != "true" ? "d-none" : ""}" title="Bouteille d'essence">Bouteille d'essence <i class="mdi mdi-gas-station"></i></th>
              <th class="${this.getAttribute("is_salaire") != "true" ? "d-none" : ""}" title="Bidon pétrole de synt">Bidon pétrole de synt <i class="mdi mdi-oil"></i></th>
              <th class="${this.getAttribute("is_salaire") != "true" ? "d-none" : ""}" title="Bidon d'essence">Bidon d'essence <i class="mdi mdi-fuel"></i></th>
              <th class="${this.getAttribute("is_salaire") != "true" ? "d-none" : ""}" title="Livraison">Livraison <i class="mdi mdi-truck-delivery"></i></th>
              <th class="${this.getAttribute("is_salaire") != "true" ? "d-none" : ""}" title="Quota">Quota actuel <i class="mdi mdi-chart-bar"></i></th>
              <th class="${this.getAttribute("is_salaire") != "true" ? "d-none" : ""}" title="Salaire Max">Salaire Max <i class="mdi mdi-currency-eur"></i></th>
              <th class="${this.getAttribute("is_salaire") != "true" ? "d-none" : ""}" title="Salaire Restant">Salaire restant <i class="mdi mdi-currency-eur"></i></th>
              <th class="${this.getAttribute("is_salaire") != "true" ? "d-none" : ""}" title="Frais essence">Frais essence <i class="mdi mdi-gas-station"></i></th>
              <th class="${this.getAttribute("is_salaire") != "true" ? "d-none" : ""}" title="Salaire total">Salaire total <i class="mdi mdi-cash-multiple"></i></th>
              <th class="${this.getAttribute("is_salaire") == "true" || session.grade < 10 ? "d-none" : ""}" title="Modifier Utilisateur"><i class="mdi mdi-account-edit"></i></th>
              <th class="${this.getAttribute("is_salaire") == "true" || session.grade < 10 ? "d-none" : ""}" title="Supprimer Utilisateur"><i class="mdi mdi-account-delete"></i></th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
    let button_previous_week = this.querySelector('#previous-week');
    button_previous_week.addEventListener('click', this.previousWeek.bind(this));
    let button_next_week = this.querySelector('#next-week');
    button_next_week.addEventListener('click', this.nextWeek.bind(this));
    let button_current_week = this.querySelector('#current-week');
    button_current_week.addEventListener('click', this.goToCurrentWeek.bind(this));
  }
}
class DeliveryWeekTable extends HTMLElement {
  constructor() {
    super();
    this.unitPrice = 37.5;
    this.currentDate = null;
  }

  connectedCallback() {
    if (typeof session === 'undefined' || session == null) {
        document.addEventListener("session_loaded", () => {
            this.connectedCallback();
        }, { once: true });
        return;
    }
    
    // Initialiser la date courante
    const dateAttr = this.getAttribute("date");
    this.currentDate = dateAttr ? new Date(dateAttr) : new Date();

    this.renderLoading();
    this.loadData()
      .then(data => {
        this.renderTable(data);
      })
      .catch(err => {
        this.innerHTML = `<p class="text-danger">Erreur lors du chargement : ${err}</p>`;
      });
  }

  renderLoading() {
    this.innerHTML = `<p class="text-muted">Chargement des livraisons globales...</p>`;
  }

  loadData() {
    return Utils.API.get_deliveries_per_ltd_week(this.currentDate);
  }

  // Fonction pour obtenir le numéro de semaine
  getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  // Fonction pour obtenir le lundi de la semaine
  getMondayOfWeek(date) {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Ajuster pour que lundi soit le premier jour
    return new Date(date.setDate(diff));
  }

  // Fonction pour obtenir le dimanche de la semaine
  getSundayOfWeek(date) {
    const monday = this.getMondayOfWeek(new Date(date));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return sunday;
  }

  // Navigation vers la semaine précédente
  previousWeek() {
    this.currentDate.setDate(this.currentDate.getDate() - 7);
    this.renderLoading();
    this.loadData()
      .then(data => {
        this.renderTable(data);
      })
      .catch(err => {
        this.innerHTML = `<p class="text-danger">Erreur lors du chargement : ${err}</p>`;
      });
  }

  // Navigation vers la semaine suivante
  nextWeek() {
    this.currentDate.setDate(this.currentDate.getDate() + 7);
    this.renderLoading();
    this.loadData()
      .then(data => {
        this.renderTable(data);
      })
      .catch(err => {
        this.innerHTML = `<p class="text-danger">Erreur lors du chargement : ${err}</p>`;
      });
  }

  // Retour à la semaine courante
  goToCurrentWeek() {
    this.currentDate = new Date();
    this.renderLoading();
    this.loadData()
      .then(data => {
        this.renderTable(data);
      })
      .catch(err => {
        this.innerHTML = `<p class="text-danger">Erreur lors du chargement : ${err}</p>`;
      });
  }

  renderTable(data) {
    const allLtds = Object.keys(Utils.LTD);
    const deliveriesByLtd = {};

    // Calculer les informations de la semaine
    const weekNumber = this.getWeekNumber(this.currentDate);
    const monday = this.getMondayOfWeek(new Date(this.currentDate));
    const sunday = this.getSundayOfWeek(new Date(this.currentDate));
    const year = this.currentDate.getFullYear();

    let grandTotal = 0;
    const rows = allLtds.map(ltdName => {
      let qtyTotal = 0;
      data.forEach(row => {
        console.log(Utils.LTD[ltdName], parseInt(row.ltd), parseInt(row.total_livraisons));
        if(Utils.LTD[ltdName] == parseInt(row.ltd)) {
            qtyTotal += parseInt(row.total_livraisons);
        }
      });
      const qty = deliveriesByLtd[ltdName] || 0;
      const totalPrice = this.unitPrice * qtyTotal;
      grandTotal += totalPrice;
      
      return `
        <tr>
          <td>${ltdName}</td>
          <td class="text-center">${qtyTotal}</td>
          <td class="text-center">${this.unitPrice.toFixed(2)} €</td>
          <td class="text-center">${totalPrice.toFixed(2)} €</td>
        </tr>
      `;
    }).join('');

    this.innerHTML = `
      <div class="table-responsive">
        <table class="table table-hover table-bordered align-middle">
          <!-- Header de navigation des semaines -->
          <thead class="table-dark">
            <tr>
              <th colspan="4" class="p-3">
                <div class="d-flex justify-content-between align-items-center">
                  <div class="d-flex gap-2">
                    <button type="button" class="btn btn-outline-light btn-sm" onclick="this.closest('delivery-week-table').previousWeek()">
                      <i class="mdi mdi-chevron-left"></i> Semaine précédente
                    </button>
                    <button type="button" class="btn btn-light btn-sm" onclick="this.closest('delivery-week-table').goToCurrentWeek()">
                      <i class="mdi mdi-calendar-today"></i> Semaine actuelle
                    </button>
                    <button type="button" class="btn btn-outline-light btn-sm" onclick="this.closest('delivery-week-table').nextWeek()">
                      Semaine suivante <i class="mdi mdi-chevron-right"></i>
                    </button>
                  </div>
                  <div class="text-light fw-bold">
                    <i class="mdi mdi-calendar-week"></i> Semaine ${weekNumber} - ${year}
                    <br>
                    <small class="text-light opacity-75">
                      Du ${monday.toLocaleDateString('fr-FR')} au ${sunday.toLocaleDateString('fr-FR')}
                    </small>
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <!-- Header des colonnes -->
          <thead class="table-primary">
            <tr>
              <th>LTD <i class="mdi mdi-domain"></i></th>
              <th class="text-center">Total Livraisons <i class="mdi mdi-truck-delivery"></i></th>
              <th class="text-center">Prix Unitaire <i class="mdi mdi-currency-eur"></i></th>
              <th class="text-center">Prix Total <i class="mdi mdi-cash-multiple"></i></th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
          <!-- Footer avec total général -->
          <tfoot class="table-success fw-bold">
            <tr>
              <td>TOTAL GÉNÉRAL</td>
              <td class="text-center">-</td>
              <td class="text-center">-</td>
              <td class="text-center">${grandTotal.toFixed(2)} €</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;
  }
}
class UserForm extends HTMLElement {
  constructor() {
    super();
    this.modalId = null;
    this.modalEl = null;
    this.modalInstance = null;
    this.initialized = false;
    this.editMode = false;
    this.oldDiscordId = null;
  }

  connectedCallback() {
    if (typeof session === 'undefined' || session == null) {
        document.addEventListener("session_loaded", () => {
            this.connectedCallback();
        }, { once: true });
        return;
    }
    if(session.grade < Utils.GRADE.manager) {
        this.innerHTML = '';
        return;
    }
    let is_edit = this.hasAttribute('discord_id');
    let label = this.getAttribute('label') || 'Ajouter un utilisateur';
    if (is_edit) label = ' ';
    const btnClass = this.getAttribute('class') || 'btn btn-primary';
    this.innerHTML = `
      <button type="button" class="${btnClass} user-form-btn">
        <i class="mdi ${is_edit ? 'mdi-account-edit' : 'mdi-account-plus'}"></i> <span class="user-form-label">${label}</span>
      </button>
    `;
    this.btn = this.querySelector('.user-form-btn');
    this.btn.addEventListener('click', () => this.showModal());
  }

  async showModal() {
    if (typeof bootstrap === 'undefined') {
      console.warn('Bootstrap JS non trouvé : charger bootstrap.bundle.min.js avant d’utiliser <user-form>.');
      return;
    }

    if (this.modalEl) {
      this.modalInstance.show();
      return;
    }

    const suffix = Math.random().toString(36).slice(2, 9);
    this.modalId = `user-form-modal-${suffix}`;

    const ids = {
      discord: `uf_discord_${suffix}`,
      matricule: `uf_matricule_${suffix}`,
      tel: `uf_tel_${suffix}`,
      iban: `uf_iban_${suffix}`,
      name: `uf_name_${suffix}`,
      grade: `uf_grade_${suffix}`,
      submit: `uf_submit_${suffix}`
    };

    const modalHtml = `
      <div class="modal fade" id="${this.modalId}" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title"><i class="mdi mdi-account-plus"></i> <span class="uf_title">Ajouter un utilisateur</span></h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fermer"></button>
            </div>
            <div class="modal-body">
              <form id="uf_form_${suffix}">
                <div class="mb-3">
                  <label for="${ids.discord}" class="form-label">Discord ID <i class="mdi mdi-identifier"></i></label>
                  <input type="text" class="form-control" id="${ids.discord}" name="discord_id" required />
                </div>

                <div class="mb-3">
                  <label for="${ids.matricule}" class="form-label">Matricule <i class="mdi mdi-numeric"></i></label>
                  <input type="text" class="form-control" id="${ids.matricule}" name="matricule" required />
                </div>

                <div class="mb-3">
                  <label for="${ids.tel}" class="form-label">Téléphone <i class="mdi mdi-phone"></i></label>
                  <input type="text" class="form-control" id="${ids.tel}" name="tel" required />
                </div>

                <div class="mb-3">
                  <label for="${ids.IBAN}" class="form-label">IBAN <i class="mdi mdi-bank"></i></label>
                  <input type="text" class="form-control" id="${ids.IBAN}" name="iban" required />
                </div>

                <div class="mb-3">
                  <label for="${ids.name}" class="form-label">Nom complet <i class="mdi mdi-account"></i></label>
                  <input type="text" class="form-control" id="${ids.name}" name="name" required />
                </div>

                <div class="mb-3">
                  <label for="${ids.grade}" class="form-label">Grade <i class="mdi mdi-shield-account"></i></label>
                  <select class="form-select" id="${ids.grade}" name="grade" required>
                    <option value="1">Récolte Novice</option>
                    <option value="2">Récolte Confirmé</option>
                    <option value="3">Récolte Expert</option>
                    <option value="4">Production Novice</option>
                    <option value="5">Production Confirmé</option>
                    <option value="6">Production Expert</option>
                    <option value="7">Livreur Novice</option>
                    <option value="8">Livreur Confirmé</option>
                    <option value="9">Livreur Expert</option>
                    <option value="10">Manager</option>
                    <option value="11">DRH</option>
                    <option value="12">Co-Directeur</option>
                    <option value="13">Directeur</option>
                  </select>
                </div>

                <div class="d-grid">
                  <button id="${ids.submit}" type="submit" class="btn btn-success w-100">
                    <i class="mdi mdi-content-save"></i> <span class="uf_submit_label">Ajouter</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = modalHtml;
    this.modalEl = wrapper.firstElementChild;
    document.body.appendChild(this.modalEl);

    this.modalInstance = new bootstrap.Modal(this.modalEl, { backdrop: 'static' });

    this.form = this.modalEl.querySelector(`#uf_form_${suffix}`);
    this.inputDiscord = this.modalEl.querySelector(`#${ids.discord}`);
    this.inputMatricule = this.modalEl.querySelector(`#${ids.matricule}`);
    this.inputTel = this.modalEl.querySelector(`#${ids.tel}`);
    this.inputIban = this.modalEl.querySelector(`#${ids.IBAN}`);
    this.inputName = this.modalEl.querySelector(`#${ids.name}`);
    this.selectGrade = this.modalEl.querySelector(`#${ids.grade}`);
    this.submitBtn = this.modalEl.querySelector(`#${ids.submit}`);
    this.titleEl = this.modalEl.querySelector('.uf_title');
    this.submitLabelEl = this.modalEl.querySelector('.uf_submit_label');

    this.form.addEventListener('submit', (e) => this.handleSubmit(e));

    this.modalEl.addEventListener('hidden.bs.modal', () => this.destroyModal());

    const discordAttr = this.getAttribute('discord_id');
    if (discordAttr) {
      this.editMode = true;
      this.titleEl.textContent = 'Modifier un utilisateur';
      this.submitLabelEl.textContent = 'Enregistrer';
      await this.loadUserIntoForm(discordAttr);
    } else {
      this.editMode = false;
      this.oldDiscordId = null;
    }

    this.modalInstance.show();
  }

  async loadUserIntoForm(discordId) {
    try {
      const user = await Utils.API.get_user_by_discord(discordId);
      const resolved = Array.isArray(user) ? user[0] : user;
      if (!resolved) {
        alert('Utilisateur introuvable.');
        return;
      }
      this.applyUserToForm(resolved);
    } catch (err) {
      console.error(err);
      alert('Erreur lors du chargement de l’utilisateur.');
    }
  }

  applyUserToForm(user) {
    this.inputDiscord.value = user.discord_id ?? '';
    this.inputMatricule.value = user.matricule ?? '';
    this.inputTel.value = user.tel ?? '';
    this.inputIban.value = user.IBAN ?? '';
    this.inputName.value = user.name ?? '';
    this.selectGrade.value = user.grade ?? '';
    this.inputDiscord.disabled = true;
    this.oldDiscordId = user.discord_id;
  }

  async handleSubmit(e) {
    e.preventDefault();

    this.submitBtn.disabled = true;
    const spinner = document.createElement('span');
    spinner.className = 'spinner-border spinner-border-sm ms-2';
    this.submitBtn.appendChild(spinner);

    const discord_id = this.inputDiscord.value.trim();
    const matricule = this.inputMatricule.value.trim();
    const tel = this.inputTel.value.trim();
    const iban = this.inputIban.value.trim();
    const name = this.inputName.value.trim();
    const grade = this.selectGrade.value;

    if (!discord_id || !matricule || !tel || !iban || !name || !grade) {
      alert('Tous les champs sont requis.');
      this.submitBtn.disabled = false;
      spinner.remove();
      return;
    }

    try {
      let res;
      if (this.editMode) {
        res = await Utils.API.update_user(this.oldDiscordId || discord_id, matricule, tel, iban, name, grade);
      } else {
        res = await Utils.API.add_user(discord_id, matricule, tel, iban, name, grade);
      }

      if (res && res.success) {
        const detail = { action: this.editMode ? 'update' : 'add', user: { discord_id, matricule, tel, iban, name, grade } };
        this.dispatchEvent(new CustomEvent('user-saved', { detail, bubbles: true }));
        window.location.reload(true);
        this.modalInstance.hide();
      } else {
        const err = res && res.error ? res.error : 'Erreur inconnue';
        alert('Erreur: ' + err);
      }
    } catch (err) {
      console.error(err);
      alert('Une erreur est survenue.');
    } finally {
      this.submitBtn.disabled = false;
      spinner.remove();
    }
  }

  destroyModal() {
    try {
      this.form.removeEventListener('submit', this.handleSubmit);
    } catch (e) {}
    if (this.modalInstance) {
      try { this.modalInstance.dispose(); } catch (e) {}
    }
    if (this.modalEl && this.modalEl.parentNode) {
      this.modalEl.parentNode.removeChild(this.modalEl);
    }
    this.modalEl = null;
    this.modalInstance = null;
    this.editMode = false;
    this.oldDiscordId = null;
  }
}


class UserDelete extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    if (typeof session === 'undefined' || session == null) {
        document.addEventListener("session_loaded", () => {
            this.connectedCallback();
        }, { once: true });
        return;
    }
    if(session.grade < Utils.GRADE.manager) {
        this.innerHTML = '';
        return;
    }
    const discordId = this.getAttribute('discord_id');
    const btnClass = this.getAttribute('class') || 'btn btn-danger btn-sm';
    const label = this.getAttribute('label') || '';

    this.innerHTML = `
      <button type="button" class="${btnClass}">
        <i class="mdi mdi-delete"></i> ${label}
      </button>
    `;

    this.querySelector('button').addEventListener('click', async () => {
        if (!discordId) {
            console.error('Aucun discord_id fourni à <user-delete>.');
            return;
        }

        const confirmMsg = this.getAttribute('confirm') || 'Êtes-vous sûr de vouloir supprimer cet utilisateur ?';
        if (!await Utils.confirmDelete(confirmMsg)) return;

        Utils.API.delete_user(discordId).then(()=>{
            window.location.reload(true);
        });
    });
  }
}


class DeclarationTable extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    if (typeof session === 'undefined' || session == null) {
        document.addEventListener("session_loaded", () => {
            this.connectedCallback();
        }, { once: true });
        return;
    }
    const dateStart = this.getAttribute('start') || null;
    const dateEnd = this.getAttribute('end') || null;

    this.renderLoading();

    Utils.API.get_declarations({ start: dateStart, end: dateEnd })
      .then(data => {
        this.renderTable(data);
      })
      .catch(err => {
        this.innerHTML = `<p class="text-danger">Erreur lors du chargement : ${err}</p>`;
      });
  }

  renderLoading() {
    this.innerHTML = `<p class="text-muted">Chargement des déclarations...</p>`;
  }

  renderTable(data) {
    if (!data || data.length === 0) {
      this.innerHTML = `<p class="text-warning">Aucune déclaration trouvée pour cette période.</p>`;
      return;
    }

    const rows = data.map(row => {
      return `
        <tr>
          <td>${row.type}</td>
          <td class="text-center">${row.quantite}</td>
          <td>${row.lieu || ''}</td>
          <td>${row.image ? `<img src="${row.image}" alt="preuve" style="max-height:40px;">` : ''}</td>
          <td>${new Date(row.date_declaration).toLocaleString()}</td>
          <td class="${session.grade < 11 ? "d-none" : ""}"><delete-declaration declaration_id="${row.id}"><i class="mdi mdi-delete"></i></delete-declaration></td>
        </tr>
      `;
    }).join('');

    this.innerHTML = `
      <div class="table-responsive">
        <table class="table table-hover table-bordered align-middle">
          <thead class="table-primary">
            <tr>
              <th>Type <i class="mdi mdi-format-list-bulleted"></i></th>
              <th>Quantité <i class="mdi mdi-counter"></i></th>
              <th>Lieu <i class="mdi mdi-map-marker"></i></th>
              <th>Image <i class="mdi mdi-camera"></i></th>
              <th>Date Déclaration <i class="mdi mdi-calendar"></i></th>
              <th class="${session.grade < 11 ? "d-none" : ""}"><i class="mdi mdi-delete"></i></th>
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
class DeleteDeclaration extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    // On attend la session si pas encore chargée
    if (typeof session === 'undefined' || session == null) {
      document.addEventListener("session_loaded", () => {
        this.connectedCallback();
      }, { once: true });
      return;
    }

    // Vérification des droits (manager minimum)
    if (session.grade < Utils.GRADE.manager) {
      this.innerHTML = '';
      return;
    }

    const declarationId = this.getAttribute('declaration_id');
    const btnClass = this.getAttribute('class') || 'btn btn-danger btn-sm';
    const label = this.getAttribute('label') || '';
    const confirmMsg = this.getAttribute('confirm') || 'Êtes-vous sûr de vouloir supprimer cette déclaration ?';

    this.innerHTML = `
      <button type="button" class="${btnClass}">
        <i class="mdi mdi-delete"></i> ${label}
      </button>
    `;

    this.querySelector('button').addEventListener('click', async () => {
      if (!declarationId) {
        console.error('Aucun id fourni à <delete-declaration>.');
        return;
      }

      if (!await Utils.confirmDelete(confirmMsg)) return;

      try {
        // Appelle la méthode API adaptée pour supprimer la déclaration par id
        await Utils.API.delete_declaration(declarationId);
        window.location.reload(true);
      } catch (error) {
        console.error('Erreur lors de la suppression de la déclaration :', error);
        alert('La suppression a échoué. Veuillez réessayer.');
      }
    });
  }
}
// Tableau des factures
class FactureTable extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    if (typeof session === 'undefined' || session == null) {
        document.addEventListener("session_loaded", () => {
            this.connectedCallback();
        }, { once: true });
        return;
    }
    this.renderLoading();
    this.loadData()
      .then(data => {
        this.renderTable(data);
      })
      .catch(error => {
        this.innerHTML = `<p class="text-danger">Erreur lors du chargement des factures : ${error.message}</p>`;
      });
  }

  renderLoading() {
    this.innerHTML = `<p class="text-muted">Chargement des factures...</p>`;
  }

  loadData() {
    // Vous devrez adapter ceci selon votre API
    return Utils.API.get_factures();
  }

  renderTable(data) {
    if (!data || data.length === 0) {
      this.innerHTML = `<p class="text-warning">Aucune facture trouvée.</p>`;
      return;
    }

    const statusBadge = (statut) => {
      const badges = {
        'payee': 'badge bg-success',
        'en_attente': 'badge bg-warning text-dark',
        'annulee': 'badge bg-danger'
      };
      return badges[statut] || 'badge bg-secondary';
    };

    let total = 0;

    const rows = data.map(facture => {
    facture.montant = parseFloat(facture.montant);
    total += facture.montant;
      return `
        <tr>
          <td>${facture.id}</td>
          <td class="text-end ${facture.montant > 0 ? "text-success" : "text-danger"}">${facture.montant.toFixed(2)}<i class="mdi mdi-currency-eur"></i></td>
          <td class="text-center">
            <span class="${statusBadge(facture.statut)}">
              ${facture.statut.replace('_', ' ')}
            </span>
          </td>
          <td>${facture.label || ''} <i class="mdi mdi-label"></i></td>
          <td class="text-center">${new Date(facture.date_facture).toLocaleDateString()} <i class="mdi mdi-calendar"></i></td>
          <td class="${session.grade < Utils.GRADE.manager ? "d-none" : ""}">
            <facture-update facture_id="${facture.id}"></facture-update>
          </td>
          <td class="${session.grade < Utils.GRADE.manager ? "d-none" : ""}">
            <facture-delete facture_id="${facture.id}"></facture-delete>
          </td>
        </tr>
      `;
    }).join("");

    this.innerHTML = `
      <div class="table-responsive">
        <table class="table table-striped table-hover table-bordered align-middle">
          <thead class="table-primary text-dark">
            <tr>
              <th>ID <i class="mdi mdi-identifier"></i></th>
              <th>Montant <i class="mdi mdi-currency-eur"></i></th>
              <th>Statut <i class="mdi mdi-check-circle"></i></th>
              <th>Label <i class="mdi mdi-label"></i></th>
              <th>Date <i class="mdi mdi-calendar"></i></th>
              <th class="${session.grade < Utils.GRADE.manager ? "d-none" : ""}">
                <i class="mdi mdi-pencil"></i>
              </th>
              <th class="${session.grade < Utils.GRADE.manager ? "d-none" : ""}">
                <i class="mdi mdi-delete"></i>
              </th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
          <tfoot>
            <tr>
              <th colspan="2" class="text-end">Total : ${total.toFixed(2)}<i class="mdi mdi-currency-eur"></i></th>
            </tr>
        </table>
      </div>
    `;
  }
}

// Suppression de factures
class FactureDelete extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    if (typeof session === 'undefined' || session == null) {
        document.addEventListener("session_loaded", () => {
            this.connectedCallback();
        }, { once: true });
        return;
    }
    
    if(session.grade < Utils.GRADE.manager) {
        this.innerHTML = '';
        return;
    }

    const factureId = this.getAttribute('facture_id');
    const btnClass = this.getAttribute('class') || 'btn btn-danger btn-sm';
    const label = this.getAttribute('label') || '';

    this.innerHTML = `
      <button type="button" class="${btnClass}" title="Supprimer la facture">
        <i class="mdi mdi-delete"></i> ${label}
      </button>
    `;

    this.querySelector('button').addEventListener('click', async () => {
        if (!factureId) {
            console.error('Aucun facture_id fourni à <facture-delete>.');
            return;
        }

        const confirmMsg = this.getAttribute('confirm') || 'Êtes-vous sûr de vouloir supprimer cette facture ?';
        if (!await Utils.confirmDelete(confirmMsg)) return;

        try {
            await Utils.API.delete_facture(factureId);
            window.location.reload(true);
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            alert('Erreur lors de la suppression de la facture.');
        }
    });
  }
}

// Modification de factures
class FactureUpdate extends HTMLElement {
  constructor() {
    super();
    this.modalId = null;
    this.modalEl = null;
    this.modalInstance = null;
    this.factureData = null;
  }

  connectedCallback() {
    if (typeof session === 'undefined' || session == null) {
        document.addEventListener("session_loaded", () => {
            this.connectedCallback();
        }, { once: true });
        return;
    }
    if(session.grade < Utils.GRADE.manager) {
        this.innerHTML = '';
        return;
    }

    const btnClass = this.getAttribute('class') || 'btn btn-primary btn-sm';
    const label = this.getAttribute('label') || '';

    this.innerHTML = `
      <button type="button" class="${btnClass}" title="Modifier la facture">
        <i class="mdi mdi-pencil"></i> ${label}
      </button>
    `;

    this.btn = this.querySelector('button');
    this.btn.addEventListener('click', () => this.showModal());
  }

  async showModal() {
    if (typeof bootstrap === 'undefined') {
      console.warn('Bootstrap JS non trouvé');
      return;
    }

    const factureId = this.getAttribute('facture_id');
    if (!factureId) {
      console.error('Aucun facture_id fourni');
      return;
    }

    // Charger les données de la facture
    try {
      this.factureData = await Utils.API.get_facture_by_id(factureId);
    } catch (error) {
      console.error('Erreur lors du chargement de la facture:', error);
      alert('Erreur lors du chargement de la facture');
      return;
    }
    console.log(this.factureData)

    if (this.modalEl) {
      this.modalInstance.show();
      return;
    }

    const suffix = Math.random().toString(36).slice(2, 9);
    this.modalId = `facture-update-modal-${suffix}`;

    const ids = {
      montant: `fu_montant_${suffix}`,
      statut: `fu_statut_${suffix}`,
      label: `fu_label_${suffix}`,
      submit: `fu_submit_${suffix}`
    };

    console.log(this.factureData, this.factureData[0]);
    this.factureData = this.factureData[0];
    console.log(this.factureData);
    const modalHtml = `
      <div class="modal fade" id="${this.modalId}" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="mdi mdi-receipt"></i> Modifier la facture #${factureId}
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fermer"></button>
            </div>
            <div class="modal-body">
              <form id="fu_form_${suffix}">
                <div class="mb-3">
                  <label for="${ids.montant}" class="form-label">Montant (€) <i class="mdi mdi-currency-eur"></i></label>
                  <input type="number" class="form-control" id="${ids.montant}" value="${this.factureData.montant}" name="montant" step="0.01" required />
                </div>

                <div class="mb-3">
                  <label for="${ids.statut}" class="form-label">Statut <i class="mdi mdi-check-circle"></i></label>
                  <select class="form-select" id="${ids.statut}" value="${this.factureData.statut}" name="statut" required>
                    <option value="en_attente">En attente</option>
                    <option value="payee">Payée</option>
                    <option value="annulee">Annulée</option>
                  </select>
                </div>

                <div class="mb-3">
                  <label for="${ids.label}" class="form-label">Label <i class="mdi mdi-label"></i></label>
                  <input type="text" class="form-control" id="${ids.label}" value="${this.factureData.label}" name="label" placeholder="Description optionnelle" />
                </div>

                <div class="d-grid">
                  <button id="${ids.submit}" type="submit" class="btn btn-success w-100">
                    <i class="mdi mdi-content-save"></i> Enregistrer les modifications
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = modalHtml;
    this.modalEl = wrapper.firstElementChild;
    document.body.appendChild(this.modalEl);

    this.modalInstance = new bootstrap.Modal(this.modalEl, { backdrop: 'static' });

    // Récupération des éléments du formulaire
    this.form = this.modalEl.querySelector(`#fu_form_${suffix}`);
    this.inputMontant = this.modalEl.querySelector(`#${ids.montant}`);
    this.selectStatut = this.modalEl.querySelector(`#${ids.statut}`);
    this.inputLabel = this.modalEl.querySelector(`#${ids.label}`);
    this.submitBtn = this.modalEl.querySelector(`#${ids.submit}`);

    // Pré-remplissage avec les données existantes
    this.populateForm();

    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    this.modalEl.addEventListener('hidden.bs.modal', () => this.destroyModal());

    this.modalInstance.show();
  }

  populateForm() {
    if (!this.factureData) return;

    this.inputMontant.value = this.factureData.montant || '';
    this.selectStatut.value = this.factureData.statut || 'en_attente';
    this.inputLabel.value = this.factureData.label || '';
  }

  async handleSubmit(e) {
    e.preventDefault();

    this.submitBtn.disabled = true;
    const spinner = document.createElement('span');
    spinner.className = 'spinner-border spinner-border-sm ms-2';
    this.submitBtn.appendChild(spinner);

    const formData = {
      montant: parseFloat(this.inputMontant.value),
      statut: this.selectStatut.value,
      label: this.inputLabel.value.trim()
    };

    if (!formData.montant || !formData.statut) {
      alert('Veuillez remplir tous les champs obligatoires.');
      this.submitBtn.disabled = false;
      spinner.remove();
      return;
    }

    try {
      const factureId = this.getAttribute('facture_id');
      await Utils.API.update_facture(factureId, formData);
      
      this.dispatchEvent(new CustomEvent('facture-updated', { 
        detail: { factureId, ...formData }, 
        bubbles: true 
      }));
      
      window.location.reload(true);
      this.modalInstance.hide();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour de la facture.');
    } finally {
      this.submitBtn.disabled = false;
      spinner.remove();
    }
  }

  destroyModal() {
    try {
      this.form.removeEventListener('submit', this.handleSubmit);
    } catch (e) {}
    
    if (this.modalInstance) {
      try { this.modalInstance.dispose(); } catch (e) {}
    }
    
    if (this.modalEl && this.modalEl.parentNode) {
      this.modalEl.parentNode.removeChild(this.modalEl);
    }
    
    this.modalEl = null;
    this.modalInstance = null;
    this.factureData = null;
  }
}
class FactureForm extends HTMLElement {
  constructor() {
    super();
    this.modalId = null;
    this.modalEl = null;
    this.modalInstance = null;
  }

  connectedCallback() {
    if(session == null) {
        document.addEventListener("session_loaded", () => {
            this.connectedCallback();
        });
        return;
    }
    
    if(session.grade < Utils.GRADE.manager) {
        this.innerHTML = '';
        return;
    }

    let label = this.getAttribute('label') || 'Nouvelle Facture';
    const btnClass = this.getAttribute('class') || 'btn btn-success';
    
    this.innerHTML = `
      <button type="button" class="${btnClass}">
        <i class="mdi mdi-plus"></i> <span class="facture-form-label">${label}</span>
      </button>
    `;
    
    this.btn = this.querySelector('button');
    this.btn.addEventListener('click', () => this.showModal());
  }

  async showModal() {
    if (typeof bootstrap === 'undefined') {
      console.warn('Bootstrap JS non trouvé');
      return;
    }

    if (this.modalEl) {
      this.modalInstance.show();
      return;
    }

    const suffix = Math.random().toString(36).slice(2, 9);
    this.modalId = `facture-form-modal-${suffix}`;

    const ids = {
      montant: `ff_montant_${suffix}`,
      statut: `ff_statut_${suffix}`,
      label: `ff_label_${suffix}`,
      submit: `ff_submit_${suffix}`
    };

    const modalHtml = `
      <div class="modal fade" id="${this.modalId}" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="mdi mdi-receipt"></i> Créer une nouvelle facture
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fermer"></button>
            </div>
            <div class="modal-body">
              <form id="ff_form_${suffix}">
                <div class="mb-3">
                  <label for="${ids.montant}" class="form-label">Montant (€) <i class="mdi mdi-currency-eur"></i></label>
                  <input type="number" class="form-control" id="${ids.montant}" name="montant" step="0.01" required />
                </div>

                <div class="mb-3">
                  <label for="${ids.statut}" class="form-label">Statut <i class="mdi mdi-check-circle"></i></label>
                  <select class="form-select" id="${ids.statut}" name="statut" required>
                    <option value="en_attente" selected>En attente</option>
                    <option value="payee">Payée</option>
                    <option value="annulee">Annulée</option>
                  </select>
                </div>

                <div class="mb-3">
                  <label for="${ids.label}" class="form-label">Label <i class="mdi mdi-label"></i></label>
                  <input type="text" class="form-control" id="${ids.label}" name="label" placeholder="Description optionnelle" />
                </div>

                <div class="d-grid">
                  <button id="${ids.submit}" type="submit" class="btn btn-success w-100">
                    <i class="mdi mdi-content-save"></i> Créer la facture
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = modalHtml;
    this.modalEl = wrapper.firstElementChild;
    document.body.appendChild(this.modalEl);

    this.modalInstance = new bootstrap.Modal(this.modalEl, { backdrop: 'static' });

    // Récupération des éléments du formulaire
    this.form = this.modalEl.querySelector(`#ff_form_${suffix}`);
    this.inputMontant = this.modalEl.querySelector(`#${ids.montant}`);
    this.selectStatut = this.modalEl.querySelector(`#${ids.statut}`);
    this.inputLabel = this.modalEl.querySelector(`#${ids.label}`);
    this.submitBtn = this.modalEl.querySelector(`#${ids.submit}`);

    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    this.modalEl.addEventListener('hidden.bs.modal', () => this.destroyModal());

    this.modalInstance.show();
  }

  async handleSubmit(e) {
    e.preventDefault();

    this.submitBtn.disabled = true;
    const spinner = document.createElement('span');
    spinner.className = 'spinner-border spinner-border-sm ms-2';
    this.submitBtn.appendChild(spinner);

    const montant = parseFloat(this.inputMontant.value);
    const statut = this.selectStatut.value;
    const label = this.inputLabel.value.trim();

    if (!montant || !statut) {
      alert('Veuillez remplir tous les champs obligatoires.');
      this.submitBtn.disabled = false;
      spinner.remove();
      return;
    }

    try {
      const res = await Utils.API.add_facture(montant, statut, label);
      
      if (res && res.success) {
        this.dispatchEvent(new CustomEvent('facture-created', { 
          detail: { montant, statut, label }, 
          bubbles: true 
        }));
        window.location.reload(true);
        this.modalInstance.hide();
      } else {
        const err = res && res.error ? res.error : 'Erreur inconnue';
        alert('Erreur: ' + err);
      }
    } catch (err) {
      console.error(err);
      alert('Une erreur est survenue.');
    } finally {
      this.submitBtn.disabled = false;
      spinner.remove();
    }
  }

  destroyModal() {
    try {
      this.form.removeEventListener('submit', this.handleSubmit);
    } catch (e) {}
    
    if (this.modalInstance) {
      try { this.modalInstance.dispose(); } catch (e) {}
    }
    
    if (this.modalEl && this.modalEl.parentNode) {
      this.modalEl.parentNode.removeChild(this.modalEl);
    }
    
    this.modalEl = null;
    this.modalInstance = null;
  }
}
class VehiculeTable extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    if (typeof session === 'undefined' || session == null) {
        document.addEventListener("session_loaded", () => {
            this.connectedCallback();
        }, { once: true });
        return;
    }
    
    this.renderLoading();
    this.loadData()
      .then(data => {
        this.renderTable(data);
      })
      .catch(error => {
        this.innerHTML = `<p class="text-danger">Erreur lors du chargement des véhicules : ${error.message}</p>`;
      });
  }

  renderLoading() {
    this.innerHTML = `<p class="text-muted">Chargement des véhicules...</p>`;
  }

  loadData() {
    return Utils.API.get_vehicules();
  }

  renderTable(data) {
    if (!data || data.length === 0) {
      this.innerHTML = `<p class="text-warning">Aucun véhicule trouvé.</p>`;
      return;
    }

    const statusBadge = (isTaken, userName) => {
      if (isTaken == 1) {
        return `<span class="badge bg-danger">Pris par ${userName || 'Inconnu'}</span>`;
      }
      return `<span class="badge bg-success">Disponible</span>`;
    };

    const actionButtons = (vehicule) => {
      if (vehicule.is_taken == 1) {
        // Véhicule pris
        if (vehicule.user_id == session.id) {
          // L'utilisateur connecté a pris ce véhicule
          return `<vehicule-return vehicule_id="${vehicule.id}"></vehicule-return>`;
        } else {
          // Quelqu'un d'autre a pris le véhicule
          return `<span class="text-muted">Indisponible</span>`;
        }
      } else {
        // Véhicule disponible
        return `<vehicule-take vehicule_id="${vehicule.id}"></vehicule-take>`;
      }
    };

    const rows = data.map(vehicule => {
      return `
        <tr class="${vehicule.is_taken == 1 ? 'table-warning' : ''}">
          <td>${vehicule.id}</td>
          <td>${vehicule.matricule} <i class="mdi mdi-identifier"></i></td>
          <td>${vehicule.nom} <i class="mdi mdi-car"></i></td>
          <td>${vehicule.plaque} <i class="mdi mdi-card-text"></i></td>
          <td class="text-center">${statusBadge(vehicule.is_taken, vehicule.user_name)}</td>
          <td class="text-center">${vehicule.date_taken ? new Date(vehicule.date_taken).toLocaleString() : ''}</td>
          <td class="text-center">${new Date(vehicule.date_achat).toLocaleDateString()}</td>
          <td class="text-center">${actionButtons(vehicule)}</td>
          <td class="${session.grade < Utils.GRADE.manager ? "d-none" : ""}">
            <vehicule-update vehicule_id="${vehicule.id}"></vehicule-update>
          </td>
          <td class="${session.grade < Utils.GRADE.manager ? "d-none" : ""}">
            <vehicule-delete vehicule_id="${vehicule.id}"></vehicule-delete>
          </td>
        </tr>
      `;
    }).join("");

    this.innerHTML = `
      <div class="table-responsive">
        <table class="table table-striped table-hover table-bordered align-middle">
          <thead class="table-primary text-dark">
            <tr>
              <th>ID</th>
              <th>Matricule <i class="mdi mdi-identifier"></i></th>
              <th>Nom <i class="mdi mdi-car"></i></th>
              <th>Plaque <i class="mdi mdi-card-text"></i></th>
              <th>Statut <i class="mdi mdi-check-circle"></i></th>
              <th>Date Prise <i class="mdi mdi-calendar"></i></th>
              <th>Date Achat <i class="mdi mdi-calendar-plus"></i></th>
              <th>Actions <i class="mdi mdi-cog"></i></th>
              <th class="${session.grade < Utils.GRADE.manager ? "d-none" : ""}"><i class="mdi mdi-pencil"></i></th>
              <th class="${session.grade < Utils.GRADE.manager ? "d-none" : ""}"><i class="mdi mdi-delete"></i></th>
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

// Prendre un véhicule
class VehiculeTake extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    if (typeof session === 'undefined' || session == null) {
        document.addEventListener("session_loaded", () => {
            this.connectedCallback();
        }, { once: true });
        return;
    }

    const vehiculeId = this.getAttribute('vehicule_id');
    const btnClass = this.getAttribute('class') || 'btn btn-success btn-sm';

    this.innerHTML = `
      <button type="button" class="${btnClass}" title="Prendre le véhicule">
        <i class="mdi mdi-key"></i> Prendre
      </button>
    `;

    this.querySelector('button').addEventListener('click', async () => {
        if (!vehiculeId) {
            console.error('Aucun vehicule_id fourni à <vehicule-take>.');
            return;
        }

        if (!await Utils.confirm('Voulez-vous prendre ce véhicule ?', 'Confirmation')) return;

        try {
            await Utils.API.take_vehicule(vehiculeId, session.id);
            window.location.reload(true);
        } catch (error) {
            console.error('Erreur lors de la prise du véhicule:', error);
            alert('Erreur lors de la prise du véhicule.');
        }
    });
  }
}

// Rendre un véhicule
class VehiculeReturn extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    if (typeof session === 'undefined' || session == null) {
        document.addEventListener("session_loaded", () => {
            this.connectedCallback();
        }, { once: true });
        return;
    }

    const vehiculeId = this.getAttribute('vehicule_id');
    const btnClass = this.getAttribute('class') || 'btn btn-warning btn-sm';

    this.innerHTML = `
      <button type="button" class="${btnClass}" title="Rendre le véhicule">
        <i class="mdi mdi-key-remove"></i> Rendre
      </button>
    `;

    this.querySelector('button').addEventListener('click', async () => {
        if (!vehiculeId) {
            console.error('Aucun vehicule_id fourni à <vehicule-return>.');
            return;
        }

        if (!await Utils.confirm('Voulez-vous rendre ce véhicule ?', 'Confirmation')) return;

        try {
            await Utils.API.return_vehicule(vehiculeId);
            window.location.reload(true);
        } catch (error) {
            console.error('Erreur lors du rendu du véhicule:', error);
            alert('Erreur lors du rendu du véhicule.');
        }
    });
  }
}

// Formulaire d'ajout de véhicule
class VehiculeForm extends HTMLElement {
  constructor() {
    super();
    this.modalId = null;
    this.modalEl = null;
    this.modalInstance = null;
  }

  connectedCallback() {
    if(session == null) {
        document.addEventListener("session_loaded", () => {
            this.connectedCallback();
        });
        return;
    }
    
    if(session.grade < Utils.GRADE.manager) {
        this.innerHTML = '';
        return;
    }

    let label = this.getAttribute('label') || 'Nouveau Véhicule';
    const btnClass = this.getAttribute('class') || 'btn btn-success';
    
    this.innerHTML = `
      <button type="button" class="${btnClass}">
        <i class="mdi mdi-plus"></i> <span class="vehicule-form-label">${label}</span>
      </button>
    `;
    
    this.btn = this.querySelector('button');
    this.btn.addEventListener('click', () => this.showModal());
  }

  async showModal() {
    if (typeof bootstrap === 'undefined') {
      console.warn('Bootstrap JS non trouvé');
      return;
    }

    if (this.modalEl) {
      this.modalInstance.show();
      return;
    }

    const suffix = Math.random().toString(36).slice(2, 9);
    this.modalId = `vehicule-form-modal-${suffix}`;

    const ids = {
      matricule: `vf_matricule_${suffix}`,
      nom: `vf_nom_${suffix}`,
      plaque: `vf_plaque_${suffix}`,
      submit: `vf_submit_${suffix}`
    };

    const modalHtml = `
      <div class="modal fade" id="${this.modalId}" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="mdi mdi-car-plus"></i> Ajouter un nouveau véhicule
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fermer"></button>
            </div>
            <div class="modal-body">
              <form id="vf_form_${suffix}">
                <div class="mb-3">
                  <label for="${ids.matricule}" class="form-label">Matricule <i class="mdi mdi-identifier"></i></label>
                  <input type="text" class="form-control" id="${ids.matricule}" name="matricule" required />
                </div>

                <div class="mb-3">
                  <label for="${ids.nom}" class="form-label">Nom du véhicule <i class="mdi mdi-car"></i></label>
                  <input type="text" class="form-control" id="${ids.nom}" name="nom" required />
                </div>

                <div class="mb-3">
                  <label for="${ids.plaque}" class="form-label">Plaque d'immatriculation <i class="mdi mdi-card-text"></i></label>
                  <input type="text" class="form-control" id="${ids.plaque}" name="plaque" required />
                </div>

                <div class="d-grid">
                  <button id="${ids.submit}" type="submit" class="btn btn-success w-100">
                    <i class="mdi mdi-content-save"></i> Ajouter le véhicule
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = modalHtml;
    this.modalEl = wrapper.firstElementChild;
    document.body.appendChild(this.modalEl);

    this.modalInstance = new bootstrap.Modal(this.modalEl, { backdrop: 'static' });

    // Récupération des éléments du formulaire
    this.form = this.modalEl.querySelector(`#vf_form_${suffix}`);
    this.inputMatricule = this.modalEl.querySelector(`#${ids.matricule}`);
    this.inputNom = this.modalEl.querySelector(`#${ids.nom}`);
    this.inputPlaque = this.modalEl.querySelector(`#${ids.plaque}`);
    this.submitBtn = this.modalEl.querySelector(`#${ids.submit}`);

    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    this.modalEl.addEventListener('hidden.bs.modal', () => this.destroyModal());

    this.modalInstance.show();
  }

  async handleSubmit(e) {
    e.preventDefault();

    this.submitBtn.disabled = true;
    const spinner = document.createElement('span');
    spinner.className = 'spinner-border spinner-border-sm ms-2';
    this.submitBtn.appendChild(spinner);

    const matricule = this.inputMatricule.value.trim();
    const nom = this.inputNom.value.trim();
    const plaque = this.inputPlaque.value.trim();

    if (!matricule || !nom || !plaque) {
      alert('Veuillez remplir tous les champs.');
      this.submitBtn.disabled = false;
      spinner.remove();
      return;
    }

    try {
      await Utils.API.add_vehicule(matricule, nom, plaque);
      window.location.reload(true);
      this.modalInstance.hide();
    } catch (err) {
      console.error(err);
      alert('Une erreur est survenue.');
    } finally {
      this.submitBtn.disabled = false;
      spinner.remove();
    }
  }

  destroyModal() {
    try {
      this.form.removeEventListener('submit', this.handleSubmit);
    } catch (e) {}
    
    if (this.modalInstance) {
      try { this.modalInstance.dispose(); } catch (e) {}
    }
    
    if (this.modalEl && this.modalEl.parentNode) {
      this.modalEl.parentNode.removeChild(this.modalEl);
    }
    
    this.modalEl = null;
    this.modalInstance = null;
  }
}

// Modification de véhicule
class VehiculeUpdate extends HTMLElement {
  constructor() {
    super();
    this.modalId = null;
    this.modalEl = null;
    this.modalInstance = null;
    this.vehiculeData = null;
  }

  connectedCallback() {
    if (typeof session === 'undefined' || session == null) {
        document.addEventListener("session_loaded", () => {
            this.connectedCallback();
        }, { once: true });
        return;
    }
    
    if(session.grade < Utils.GRADE.manager) {
        this.innerHTML = '';
        return;
    }

    const btnClass = this.getAttribute('class') || 'btn btn-primary btn-sm';
    const label = this.getAttribute('label') || '';

    this.innerHTML = `
      <button type="button" class="${btnClass}" title="Modifier le véhicule">
        <i class="mdi mdi-pencil"></i> ${label}
      </button>
    `;

    this.btn = this.querySelector('button');
    this.btn.addEventListener('click', () => this.showModal());
  }

  async showModal() {
    if (typeof bootstrap === 'undefined') {
      console.warn('Bootstrap JS non trouvé');
      return;
    }

    const vehiculeId = this.getAttribute('vehicule_id');
    if (!vehiculeId) {
      console.error('Aucun vehicule_id fourni');
      return;
    }

    // Charger les données du véhicule
    try {
      const data = await Utils.API.get_vehicule_by_id(vehiculeId);
      this.vehiculeData = data[0];
    } catch (error) {
      console.error('Erreur lors du chargement du véhicule:', error);
      alert('Erreur lors du chargement du véhicule');
      return;
    }

    if (this.modalEl) {
      this.populateForm();
      this.modalInstance.show();
      return;
    }

    const suffix = Math.random().toString(36).slice(2, 9);
    this.modalId = `vehicule-update-modal-${suffix}`;

    const ids = {
      matricule: `vu_matricule_${suffix}`,
      nom: `vu_nom_${suffix}`,
      plaque: `vu_plaque_${suffix}`,
      submit: `vu_submit_${suffix}`
    };

    const modalHtml = `
      <div class="modal fade" id="${this.modalId}" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="mdi mdi-car-cog"></i> Modifier le véhicule #${vehiculeId}
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fermer"></button>
            </div>
            <div class="modal-body">
              <form id="vu_form_${suffix}">
                <div class="mb-3">
                  <label for="${ids.matricule}" class="form-label">Matricule <i class="mdi mdi-identifier"></i></label>
                  <input type="text" class="form-control" id="${ids.matricule}" name="matricule" required />
                </div>

                <div class="mb-3">
                  <label for="${ids.nom}" class="form-label">Nom du véhicule <i class="mdi mdi-car"></i></label>
                  <input type="text" class="form-control" id="${ids.nom}" name="nom" required />
                </div>

                <div class="mb-3">
                  <label for="${ids.plaque}" class="form-label">Plaque d'immatriculation <i class="mdi mdi-card-text"></i></label>
                  <input type="text" class="form-control" id="${ids.plaque}" name="plaque" required />
                </div>

                <div class="d-grid">
                  <button id="${ids.submit}" type="submit" class="btn btn-success w-100">
                    <i class="mdi mdi-content-save"></i> Enregistrer les modifications
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = modalHtml;
    this.modalEl = wrapper.firstElementChild;
    document.body.appendChild(this.modalEl);

    this.modalInstance = new bootstrap.Modal(this.modalEl, { backdrop: 'static' });

    // Récupération des éléments du formulaire
    this.form = this.modalEl.querySelector(`#vu_form_${suffix}`);
    this.inputMatricule = this.modalEl.querySelector(`#${ids.matricule}`);
    this.inputNom = this.modalEl.querySelector(`#${ids.nom}`);
    this.inputPlaque = this.modalEl.querySelector(`#${ids.plaque}`);
    this.submitBtn = this.modalEl.querySelector(`#${ids.submit}`);

    // Pré-remplissage avec les données existantes
    this.populateForm();

    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    this.modalEl.addEventListener('hidden.bs.modal', () => this.destroyModal());

    this.modalInstance.show();
  }

  populateForm() {
    if (!this.vehiculeData) return;

    this.inputMatricule.value = this.vehiculeData.matricule || '';
    this.inputNom.value = this.vehiculeData.nom || '';
    this.inputPlaque.value = this.vehiculeData.plaque || '';
  }

  async handleSubmit(e) {
    e.preventDefault();

    this.submitBtn.disabled = true;
    const spinner = document.createElement('span');
    spinner.className = 'spinner-border spinner-border-sm ms-2';
    this.submitBtn.appendChild(spinner);

    const formData = {
      matricule: this.inputMatricule.value.trim(),
      nom: this.inputNom.value.trim(),
      plaque: this.inputPlaque.value.trim()
    };

    if (!formData.matricule || !formData.nom || !formData.plaque) {
      alert('Veuillez remplir tous les champs.');
      this.submitBtn.disabled = false;
      spinner.remove();
      return;
    }

    try {
      const vehiculeId = this.getAttribute('vehicule_id');
      await Utils.API.update_vehicule(vehiculeId, formData);
      
      window.location.reload(true);
      this.modalInstance.hide();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour du véhicule.');
    } finally {
      this.submitBtn.disabled = false;
      spinner.remove();
    }
  }

  destroyModal() {
    try {
      this.form.removeEventListener('submit', this.handleSubmit);
    } catch (e) {}
    
    if (this.modalInstance) {
      try { this.modalInstance.dispose(); } catch (e) {}
    }
    
    if (this.modalEl && this.modalEl.parentNode) {
      this.modalEl.parentNode.removeChild(this.modalEl);
    }
    
    this.modalEl = null;
    this.modalInstance = null;
    this.vehiculeData = null;
  }
}

// Suppression de véhicule
class VehiculeDelete extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    if (typeof session === 'undefined' || session == null) {
        document.addEventListener("session_loaded", () => {
            this.connectedCallback();
        }, { once: true });
        return;
    }
    
    if(session.grade < Utils.GRADE.manager) {
        this.innerHTML = '';
        return;
    }

    const vehiculeId = this.getAttribute('vehicule_id');
    const btnClass = this.getAttribute('class') || 'btn btn-danger btn-sm';
    const label = this.getAttribute('label') || '';

    this.innerHTML = `
      <button type="button" class="${btnClass}" title="Supprimer le véhicule">
        <i class="mdi mdi-delete"></i> ${label}
      </button>
    `;

    this.querySelector('button').addEventListener('click', async () => {
        if (!vehiculeId) {
            console.error('Aucun vehicule_id fourni à <vehicule-delete>.');
            return;
        }

        if (!await Utils.confirmDelete('Ce véhicule sera définitivement supprimé.', 'ce véhicule')) return;

        try {
            await Utils.API.delete_vehicule(vehiculeId);
            window.location.reload(true);
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            alert('Erreur lors de la suppression du véhicule.');
        }
    });
  }
}

// Enregistrement des custom elements
customElements.define('vehicule-table', VehiculeTable);
customElements.define('vehicule-take', VehiculeTake);
customElements.define('vehicule-return', VehiculeReturn);
customElements.define('vehicule-form', VehiculeForm);
customElements.define('vehicule-update', VehiculeUpdate);
customElements.define('vehicule-delete', VehiculeDelete);
customElements.define('facture-form', FactureForm);
customElements.define('facture-table', FactureTable);
customElements.define('facture-delete', FactureDelete);
customElements.define('facture-update', FactureUpdate);
customElements.define('delete-declaration', DeleteDeclaration);
customElements.define('declaration-table', DeclarationTable);
customElements.define('user-delete', UserDelete);
customElements.define('user-form', UserForm);
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
