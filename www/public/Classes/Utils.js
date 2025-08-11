export function getFirstDayOfWeek(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  console.log(diff);
  return new Date(date.setDate(diff));
}

export class API {
    static get_session() {
        let searchParams = new URLSearchParams(window.location.search);
        let uuid = searchParams.get("user");
        return API.get_sql(`SELECT * FROM user WHERE uuid = '${uuid}'`);
    }

    // get this data for week declartion for user
    // Date d'arrivée
    // Matricules
    // Nom - ID
    // Tel
    // IBAN
    // Grade
    // Avertissement
    // Bouteille d'essence
    // Bidon pétrole de synt
    // Bidon d'essence
    // Livraison
    // Frais essence
    static get_users_data_for_week(uuid, date) {
        let start_week = Utils.getFirstDayOfWeek(Date.today()).toISOString();
        let end_week = new Date(date.setDate(date.getDate() + 7)).toISOString();
        $sql = `SELECT
        u.date_entree,
        u.matricule,
        u.name,
        u.phone,
        u.iban,
        u.grade,
        u.avertissements,
        SUM(d.bouteille_essence) AS bouteille_essence,
        SUM(d.bidon_petrole_synt) AS bidon_petrole_synt,
        SUM(d.bidon_essence) AS bidon_essence,
        SUM(d.livraison) AS livraison,
        SUM(d.essence) AS frais_essence,
        FROM users u
        LEFT JOIN declarations d ON u.matricule = d.matricule
        WHERE u.role = 'Employé' AND u.date_entree >= '${start_week}' AND u.date_entree < '${end_week}' GROUP BY u.matricule ORDER BY u.grade ASC ORDER BY u.date_entree ASC;`;
        return API.get_sql($sql);
    }

    static get_sql($sql) {
        return fetch(`/api/sqltojson.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sql: $sql,
            })
        })
        .then(response => response.json())
        .then(data => {
            return data;
        });
    }
}