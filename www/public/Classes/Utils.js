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
        let uuid = searchParams.get("discord");
        return API.get_sql(`SELECT * FROM users WHERE discord_id = '${uuid}'`);
    }

    static add_user(discord_id, matricule, name, grade) {
        let sql = `INSERT INTO users (discord_id, matricule, name, grade, date_entree, avertissements) VALUES ('${discord_id}', '${matricule}', '${name}', '${grade}', CURRENT_TIMESTAMP, 0);`;
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
    u.avertissements,
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
        return API.get_sql(sql, true);
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


    static get_sql(sql, force_array = false) {
        return new Promise((resolve, reject) => {
            let form = new FormData();
            form.append('sql', sql);
            form.append('force_array', force_array);
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