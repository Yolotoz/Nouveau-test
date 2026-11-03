--!strict
-- Réglages du jeu : c'est le seul fichier à modifier pour adapter le système
-- à un autre jeu (prix, revenus, identifiants de Game Pass et de produits).

local Config = {}

-- Argent au tout premier lancement d'un joueur
Config.STARTING_CASH = 0

-- Revenu de base par seconde, même sans aucune amélioration
Config.BASE_INCOME = 1

-- Intervalle (en secondes) entre deux versements de revenu
Config.TICK_SECONDS = 1

-- Intervalle (en secondes) entre deux sauvegardes automatiques
Config.AUTOSAVE_SECONDS = 60

-- Identifiant du Game Pass "Argent x2" (0 = désactivé).
-- À récupérer dans le Creator Hub après avoir créé le Game Pass.
Config.GAMEPASS_DOUBLE_CASH = 0

-- Produits développeur achetables plusieurs fois : [identifiant] = argent donné.
-- Exemple : [1234567890] = 1000,
Config.CASH_PRODUCTS = {} :: { [number]: number }

export type Upgrade = {
	id: string,
	name: string,
	price: number,
	income: number, -- argent gagné en plus chaque seconde
}

-- Améliorations achetables dans la boutique, dans l'ordre d'affichage
Config.UPGRADES = {
	{ id = "micro", name = "Micro", price = 25, income = 1 },
	{ id = "enceinte", name = "Enceinte", price = 150, income = 5 },
	{ id = "platine", name = "Platine DJ", price = 800, income = 20 },
	{ id = "synthe", name = "Synthé", price = 4000, income = 80 },
	{ id = "studio", name = "Studio Pro", price = 20000, income = 300 },
} :: { Upgrade }

function Config.getUpgrade(id: string): Upgrade?
	for _, upgrade in Config.UPGRADES do
		if upgrade.id == id then
			return upgrade
		end
	end
	return nil
end

return Config
