export function getFirstDayOfWeek(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  console.log(diff);
  return new Date(date.setDate(diff));
}

export function htmlToArrayElement(html) {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.children;
}

export const LTD = {
    "LTD Groove Street": 1,
    "LTD Little Seoul": 2,
    "LTD Sandy Shores": 3,
    "LTD Roxwood": 4
};
export const GRADE = {
    "recolte_novice": 1,
    "recolte_confirme": 2,
    "recolte_expert": 3,
    "production_novice": 4,
    "production_confirme": 5,
    "production_expert": 6,
    "livreur_novice": 7,
    "livreur_confirme": 8,
    "livreur_expert": 9,
    "manager": 10,
    "drh": 11,
    "co-directeur": 12,
    "directeur": 13
}


export class API {
    static get_session() {
        let searchParams = new URLSearchParams(window.location.search);
        let discord_id = searchParams.get("discord");
        return API.get_sql(`SELECT * FROM users WHERE discord_id = '${discord_id}'`);
    }

    static get_declarations() {
        return API.get_sql(`SELECT * FROM declarations ORDER BY date_declaration DESC;`);
    }

    static delete_declaration(id) {
        return API.get_sql(`DELETE FROM declarations WHERE id = ${id};`);
    }

    static add_user(discord_id, matricule, tel, IBAN, name, grade) {
        let sql = `INSERT INTO users (discord_id, matricule, tel, IBAN, name, grade, date_entree, avertissements) VALUES ('${discord_id}', '${matricule}', '${tel}', '${IBAN}', '${name}', '${grade}', CURRENT_TIMESTAMP, 0);`;
        return API.get_sql(sql);
    }
    
    static get_user_by_discord(discord_id) {
        return API.get_sql(`SELECT * FROM users WHERE discord_id = '${discord_id}';`);
    }

    static update_user(discord_id, matricule, tel, IBAN, name, grade) {
        return API.get_sql(`
            UPDATE users
            SET matricule = '${matricule}',
                tel = '${tel}',
                IBAN = '${IBAN}',
                name = '${name}',
                grade = '${grade}'
            WHERE discord_id = '${discord_id}';
        `);
    }
    static async delete_user(discord_id) {
        const sql = `DELETE FROM users WHERE discord_id = '${discord_id}'`;
        return API.get_sql(sql);
    }

    static add_declaration(user_id, type, quantite, lieu, image) {
        let sql = `INSERT INTO declarations (user_id, type, quantite, lieu, image) VALUES ('${user_id}', '${type}', '${quantite}', '${lieu}', '${image}');`;
        return API.get_sql(sql);
    }
    static get_users_data_for_week(date) {
        let start_week = getFirstDayOfWeek(date).toISOString().slice(0, 10) + " 00:00:00";
        let end_week = new Date(date.setDate(date.getDate() + 6)).toISOString().slice(0, 10) + " 00:00:00";
        console.log(start_week, end_week);
        let sql = `SELECT
    u.date_entree,
    u.matricule,
    u.name,
    u.grade,
    u.tel,
    u.IBAN,
    u.avertissements,
    u.discord_id,
    SUM(CASE WHEN d.type = 'bouteille_essence' THEN d.quantite ELSE 0 END) AS bouteille_essence,
    SUM(CASE WHEN d.type = 'bidon_sythese' THEN d.quantite ELSE 0 END) AS bidon_petrole_synt,
    SUM(CASE WHEN d.type = 'bidon_essence' THEN d.quantite ELSE 0 END) AS bidon_essence,
    SUM(CASE WHEN d.type = 'livraison' THEN d.quantite ELSE 0 END) AS livraison,
    SUM(CASE WHEN d.type = 'frais' THEN d.quantite ELSE 0 END) AS frais_essence
FROM users u
LEFT JOIN declarations d
    ON u.id = d.user_id
    AND d.date_declaration >= '${start_week}' 
    AND d.date_declaration < '${end_week}'
GROUP BY u.id, u.date_entree, u.matricule, u.name, u.grade, u.avertissements
ORDER BY u.grade ASC, u.date_entree ASC;`;
        return API.get_sql(sql);
    }

    static get_deliveries_per_ltd_week(date) {
        let start_week = getFirstDayOfWeek(new Date(date)).toISOString();
        let end_week = new Date(date);
        end_week.setDate(end_week.getDate() + 7);
        end_week = end_week.toISOString();

        let sql = `
            SELECT
                d.lieu AS ltd,
                SUM(d.quantite) AS total_livraisons
            FROM declarations d
            WHERE d.type = 'livraison'
            AND d.date_declaration >= '${start_week}'
            AND d.date_declaration < '${end_week}'
            GROUP BY d.lieu
            ORDER BY d.lieu ASC;
        `;
        return API.get_sql(sql);
    }
    static get_factures() {
        return API.get_sql(`SELECT * FROM factures ORDER BY date_facture DESC;`);
    }

    static get_facture_by_id(id) {
        return API.get_sql(`SELECT * FROM factures WHERE id = ${id};`);
    }

    static add_facture(montant, statut, label) {
        const labelValue = label ? `'${label}'` : 'NULL';
        let sql = `INSERT INTO factures (montant, statut, label, date_facture) VALUES (${montant}, '${statut}', ${labelValue}, CURRENT_TIMESTAMP);`;
        return API.get_sql(sql);
    }

    static update_facture(id, data) {
        const labelValue = data.label ? `'${data.label}'` : 'NULL';
        return API.get_sql(`
            UPDATE factures
            SET montant = ${data.montant},
                statut = '${data.statut}',
                label = ${labelValue}
            WHERE id = ${id};
        `);
    }

    static delete_facture(id) {
        return API.get_sql(`DELETE FROM factures WHERE id = ${id};`);
    }

    static get_vehicules() {
    return API.get_sql(`
        SELECT 
            v.*,
            u.name as user_name,
            u.matricule as user_matricule
        FROM vehicules v
        LEFT JOIN users u ON v.user_id = u.id
        ORDER BY v.is_taken ASC, v.nom ASC;
    `);
}

    // Récupérer un véhicule par ID
    static get_vehicule_by_id(id) {
        return API.get_sql(`
            SELECT 
                v.*,
                u.name as user_name,
                u.matricule as user_matricule
            FROM vehicules v
            LEFT JOIN users u ON v.user_id = u.id
            WHERE v.id = ${id};
        `);
    }

    // Ajouter un nouveau véhicule
    static add_vehicule(matricule, nom, plaque) {
        let sql = `INSERT INTO vehicules (matricule, nom, plaque, is_taken, date_taken, user_id, date_achat) 
                VALUES ('${matricule}', '${nom}', '${plaque}', 0, CURRENT_TIMESTAMP, 0, CURRENT_TIMESTAMP);`;
        return API.get_sql(sql);
    }

    // Prendre un véhicule
    static take_vehicule(vehicule_id, user_id) {
        return API.get_sql(`
            UPDATE vehicules 
            SET is_taken = 1, 
                date_taken = CURRENT_TIMESTAMP, 
                user_id = ${user_id}
            WHERE id = ${vehicule_id} AND is_taken = 0;
        `);
    }

    // Rendre un véhicule
    static return_vehicule(vehicule_id) {
        return API.get_sql(`
            UPDATE vehicules 
            SET is_taken = 0, 
                user_id = 0
            WHERE id = ${vehicule_id};
        `);
    }

    // Modifier un véhicule
    static update_vehicule(id, data) {
        return API.get_sql(`
            UPDATE vehicules
            SET matricule = '${data.matricule}',
                nom = '${data.nom}',
                plaque = '${data.plaque}'
            WHERE id = ${id};
        `);
    }

    // Supprimer un véhicule
    static delete_vehicule(id) {
        return API.get_sql(`DELETE FROM vehicules WHERE id = ${id};`);
    }

    static get_sql(sql) {
        return new Promise((resolve, reject) => {
            let form = new FormData();
            form.append('sql', sql);
            return fetch(`/api/sqltojson.php`, {
                method: 'POST',
                body: form
            })
            .then(response => {
                return response.json()
            })
            .then(data => {
                resolve(data);
            })
            .catch(error => {
                reject(error);
            });
        });
    }
}

export function confirm(message, title = 'Confirmation', options = {}) {
    return new Promise((resolve) => {
        // Options par défaut
        const defaultOptions = {
            confirmText: 'Confirmer',
            cancelText: 'Annuler',
            confirmClass: 'btn-danger',
            cancelClass: 'btn-secondary',
            icon: 'mdi-help-circle-outline',
            backdrop: 'static'
        };
        
        const opts = { ...defaultOptions, ...options };
        
        // ID unique pour éviter les conflits
        const modalId = `confirm-modal-${Math.random().toString(36).slice(2, 9)}`;
        
        // HTML de la modal
        const modalHtml = `
            <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="mdi ${opts.icon}"></i> ${title}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fermer"></button>
                        </div>
                        <div class="modal-body">
                            <p class="mb-0">${message}</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn ${opts.cancelClass}" data-bs-dismiss="modal">
                                <i class="mdi mdi-close"></i> ${opts.cancelText}
                            </button>
                            <button type="button" class="btn ${opts.confirmClass}" id="confirm-btn-${modalId}">
                                <i class="mdi mdi-check"></i> ${opts.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Créer et ajouter la modal au DOM
        const wrapper = document.createElement('div');
        wrapper.innerHTML = modalHtml;
        const modalEl = wrapper.firstElementChild;
        document.body.appendChild(modalEl);
        
        // Initialiser la modal Bootstrap
        const modalInstance = new bootstrap.Modal(modalEl, {
            backdrop: opts.backdrop,
            keyboard: true
        });
        
        // Récupérer les boutons
        const confirmBtn = modalEl.querySelector(`#confirm-btn-${modalId}`);
        
        // Gestionnaires d'événements
        confirmBtn.addEventListener('click', () => {
            modalInstance.hide();
            resolve(true);
        });
        
        modalEl.addEventListener('hidden.bs.modal', () => {
            // Nettoyer le DOM
            modalInstance.dispose();
            modalEl.remove();
            resolve(false);
        });
        
        // Gérer la touche Entrée pour confirmer
        modalEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                confirmBtn.click();
            }
        });
        
        // Afficher la modal
        modalInstance.show();
        
        // Focus sur le bouton de confirmation après animation
        modalEl.addEventListener('shown.bs.modal', () => {
            confirmBtn.focus();
        });
    });
}

export function confirmDelete(message, itemName = 'cet élément') {
    return confirm(
        message || `Êtes-vous sûr de vouloir supprimer ${itemName} ?`,
        'Confirmer la suppression',
        {
            confirmText: 'Supprimer',
            cancelText: 'Annuler',
            confirmClass: 'btn-danger',
            cancelClass: 'btn-secondary',
            icon: 'mdi-delete-alert'
        }
    );
}

export function confirmWarning(message, title = 'Attention') {
    return confirm(
        message,
        title,
        {
            confirmText: 'Continuer',
            cancelText: 'Annuler',
            confirmClass: 'btn-warning',
            cancelClass: 'btn-secondary',
            icon: 'mdi-alert-outline'
        }
    );
}
export function confirmSave(message, title = 'Confirmer la sauvegarde') {
    return confirm(
        message,
        title,
        {
            confirmText: 'Sauvegarder',
            cancelText: 'Annuler',
            confirmClass: 'btn-success',
            cancelClass: 'btn-secondary',
            icon: 'mdi-content-save-outline'
        }
    );
}

// Exemples d'utilisation :

/*
// Remplacement direct de confirm() - Usage basique
if (await confirm('Voulez-vous vraiment continuer ?')) {
    console.log('Utilisateur a confirmé');
} else {
    console.log('Utilisateur a annulé');
}

// Avec titre personnalisé
if (await confirm('Cette action est irréversible.', 'Êtes-vous sûr ?')) {
    // Action confirmée
}

// Avec options personnalisées
if (await confirm('Enregistrer les modifications ?', 'Sauvegarde', {
    confirmText: 'Oui, sauvegarder',
    cancelText: 'Non, annuler',
    confirmClass: 'btn-success',
    icon: 'mdi-content-save'
})) {
    // Sauvegarder
}

// Spécialisées
if (await confirmDelete('Cette facture sera définitivement supprimée.', 'cette facture')) {
    // Supprimer la facture
}

if (await confirmWarning('Cette action modifiera tous les utilisateurs.')) {
    // Continuer l'action
}

if (await confirmSave('Voulez-vous enregistrer les modifications apportées ?')) {
    // Sauvegarder
}
*/