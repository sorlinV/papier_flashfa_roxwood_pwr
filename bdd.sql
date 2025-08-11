CREATE TABLE roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL
);

-- Table des employés / utilisateurs
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    matricule TEXT UNIQUE NOT NULL,
    nom TEXT NOT NULL,
    prenom TEXT NOT NULL,
    role TEXT NOT NULL,           -- Employé, Manager, DRH, Patron
    grade TEXT NOT NULL,          -- Novice, Confirmé, Expert
    date_entree TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    avertissements NUMBER DEFAULT 0
);

-- Table des quotas hebdomadaires
CREATE TABLE quotas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    semaine TEXT NOT NULL,        -- Format YYYY-WW
    metier TEXT NOT NULL,         -- Récolte, Production, Livraison
    objectif NUMBER NOT NULL,     -- Quantité fixée
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des déclarations de production / récolte / livraison
CREATE TABLE declarations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id NUMBER NOT NULL,
    type TEXT NOT NULL,           -- recolte, production, livraison
    quantite NUMBER NOT NULL,
    lieu TEXT,                    -- Nom LTD ou site
    contenu TEXT,                 -- Description ou type de ressource
    image TEXT,                   -- Nom de fichier ou URL justificatif
    date_declaration TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des livraisons groupées par LTD
CREATE TABLE livraisons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ltd_nom TEXT NOT NULL,
    type_produit TEXT NOT NULL,   -- essence, pétrole, etc.
    quantite NUMBER NOT NULL,
    prix_unitaire NUMBER NOT NULL,
    semaine TEXT NOT NULL,
    date_livraison TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des frais (essence, réparation, etc.)
CREATE TABLE frais (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id NUMBER NOT NULL,
    type TEXT NOT NULL,           -- essence, réparation
    montant NUMBER NOT NULL,
    image TEXT,                   -- Justificatif
    date_frais TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des factures
CREATE TABLE factures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ltd_nom TEXT NOT NULL,
    montant NUMBER NOT NULL,
    semaine TEXT NOT NULL,
    statut TEXT NOT NULL,         -- A payer, Payé, Refusé
    label TEXT,                   -- Description achat/facture
    date_facture TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);