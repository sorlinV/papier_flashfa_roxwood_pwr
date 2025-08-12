-- recolte_novice
-- recolte_confirme
-- recolte_expert
-- production_novice
-- production_confirme
-- production_expert
-- livreur_novice
-- livreur_confirme
-- livreur_expert

-- manager
-- drh
-- co-directeur
-- directeur


CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    discord_id TEXT UNIQUE NOT NULL,
    matricule TEXT UNIQUE NOT NULL,
    tel TEXT NOT NULL,
    IBAN TEXT NOT NULL,
    name TEXT NOT NULL,
    grade INTEGER NOT NULL,
    date_entree TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    avertissements INTEGER DEFAULT 0
);


CREATE TABLE quotas (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    semaine TEXT NOT NULL,
    bidon_sythese INTEGER NOT NULL,
    bidon_essence INTEGER NOT NULL,
    bouteille_essence INTEGER NOT NULL,
    livraison INTEGER NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- bouteille_essence 0
-- bidon_sythese 1
-- bidon_essence 2
-- livraison 3
-- fraits 4

CREATE TABLE declarations (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL, 
    quantite INTEGER NOT NULL,
    lieu INTEGER,
    image TEXT,
    date_declaration TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE factures (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    ltd_nom TEXT NOT NULL,
    montant INTEGER NOT NULL,
    semaine TEXT NOT NULL,
    statut TEXT NOT NULL,
    label TEXT,
    date_facture TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE achat (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    label TEXT NOT NULL,
    montant INTEGER NOT NULL,
    semaine TEXT NOT NULL,
    statut TEXT NOT NULL,
    label TEXT,
    date_facture TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);