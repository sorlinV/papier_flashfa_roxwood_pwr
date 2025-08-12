import * as Utils from "./Classes/Utils.js";

await Utils.API.add_user("162613553516249088", 150, "193-7012", "STEVE", "Steven MOFFAT", Utils.GRADE.manager);

let session = null;
Utils.API.get_session().then((user) => {
    user = user[0];
    if(user.err != null) {
        console.log(user);
        return;
    }
    session = user;
    document.body.style.display = "flex";
    for (let user_name_elem of document.querySelectorAll(".user_name")) {
        console.log(user);
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
        console.log(user);
      return `
        <tr>
          <td>${new Date(user.date_entree).toISOString().slice(0, 10)} <i class="mdi mdi-calendar"></i></td>
          <td>${user.matricule || ""}</td>
          <td>${user.name || ""} <i class="mdi mdi-account"></i></td>
          <td>${user.tel || ""} <i class="mdi mdi-phone"></i></td>  
          <td>${user.IBAN || ""} <i class="mdi mdi-bank"></i></td>  
          <td>${gradeMap[gradeId] || gradeId} <i class="mdi mdi-account-badge"></i></td>
          <td>${user.avertissements || 0} <i class="mdi mdi-alert-circle-outline"></i></td>
          <td>${user.bouteille_essence || 0} <i class="mdi mdi-gas-station"></i></td>
          <td>${user.bidon_petrole_synt || 0} <i class="mdi mdi-oil"></i></td>
          <td>${user.bidon_essence || 0} <i class="mdi mdi-fuel"></i></td>
          <td>${user.livraison || 0} <i class="mdi mdi-truck-delivery"></i></td>
          <td>${user.quota_actuel || 0} <i class="mdi mdi-chart-bar"></i></td>
          <td>${salaireBrut}<i class="mdi mdi-currency-eur"></i></td>
          <td>${fraisEssence} € <i class="mdi mdi-gas-station"></i></td>
          <td>${salaireTot.toFixed(2)}<i class="mdi mdi-currency-eur"></i></td>
          <td><user-form discord_id="${user.discord_id}"></user-form></td>
          <td><user-delete discord_id="${user.discord_id}"></user-delete></td>
        </tr>
      `;
    }).join("");

    this.innerHTML = `
      <div class="table-responsive">
        <table class="table table-striped table-hover table-bordered align-middle" style="font-size: 0.5rem">
          <thead class="table-primary text-dark">
            <tr>
              <th title="Date d'arrivée">Date d'arrivée <i class="mdi mdi-calendar"></i></th>
              <th title="Matricules">Matricules</th>
              <th title="Nom">Nom<i class="mdi mdi-account"></i></th>
              <th title="Tel">Tel <i class="mdi mdi-phone"></i></th>
              <th title="IBAN">IBAN <i class="mdi mdi-bank"></i></th>
              <th title="Grade">Grade <i class="mdi mdi-account-badge"></i></th>
              <th title="Avertissements">Avertissement <i class="mdi mdi-alert-circle-outline"></i></th>
              <th title="Bouteille d'essence">Bouteille d'essence <i class="mdi mdi-gas-station"></i></th>
              <th title="Bidon pétrole de synt">Bidon pétrole de synt <i class="mdi mdi-oil"></i></th>
              <th title="Bidon d'essence">Bidon d'essence <i class="mdi mdi-fuel"></i></th>
              <th>Livraison <i class="mdi mdi-truck-delivery"></i></th>
              <th>Quota actuel <i class="mdi mdi-chart-bar"></i></th>
              <th>Salaire brut (max par grade) <i class="mdi mdi-currency-eur"></i></th>
              <th>Frais essence <i class="mdi mdi-gas-station"></i></th>
              <th>Salaire total <i class="mdi mdi-cash-multiple"></i></th>
              <th><i class="mdi mdi-account-edit"></i></th>
              <th><i class="mdi mdi-account-delete"></i></th>
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
        if (!confirm(confirmMsg)) return;

        Utils.API.delete_user(discordId).then(()=>{
            window.location.reload(true);
        });
    });
  }
}

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
