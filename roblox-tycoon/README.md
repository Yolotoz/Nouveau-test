# Système Tycoon Roblox, prêt pour mobile

Un système complet de jeu « tycoon » à intégrer dans n'importe quel jeu Roblox :

- 💰 **Argent qui augmente chaque seconde**, affiché dans le classement
- 🛒 **Boutique d'améliorations**, chaque achat augmente le revenu
- 💾 **Sauvegarde automatique** (DataStore), avec relances en cas d'erreur Roblox et protection contre la perte de progression
- ⭐ **Game Pass « Argent x2 »**, détecté à la connexion et dès l'achat
- 💎 **Produits développeur** (packs d'argent achetables plusieurs fois), protégés contre le double crédit
- 📱 **Interface pensée pour le téléphone** : gros boutons, tailles adaptées à l'écran
- 🛡️ **Anti-triche** : le serveur vérifie tous les prix et l'argent disponible

## Fichiers

| Fichier | Où le mettre dans Roblox Studio | Type |
|---|---|---|
| `src/shared/Config.luau` | `ReplicatedStorage` → dossier `Shared` → `Config` | ModuleScript |
| `src/server/DataService.luau` | `ServerScriptService` → `DataService` | ModuleScript |
| `src/server/Main.server.luau` | `ServerScriptService` → `Main` | Script |
| `src/client/HUD.client.luau` | `StarterPlayer` → `StarterPlayerScripts` → `HUD` | LocalScript |

## Installation dans Roblox Studio (copier-coller)

1. Ouvre ton jeu dans Roblox Studio.
2. Dans **ReplicatedStorage**, crée un **Folder** nommé `Shared`, puis dedans un **ModuleScript** nommé `Config`. Colle le contenu de `Config.luau`.
3. Dans **ServerScriptService**, crée un **ModuleScript** nommé `DataService` et un **Script** nommé `Main`. Colle les fichiers correspondants.
4. Dans **StarterPlayer → StarterPlayerScripts**, crée un **LocalScript** nommé `HUD`. Colle `HUD.client.luau`.
5. Pour que la sauvegarde marche en test : **Fichier → Paramètres du jeu → Sécurité → Enable Studio Access to API Services** (le jeu doit être publié une fois).
6. Clique sur **Play**.

> Les noms doivent être exactement ceux indiqués, majuscules comprises.

### Variante avancée : Rojo
Le fichier `default.project.json` permet de synchroniser le dossier avec Studio grâce à [Rojo](https://rojo.space), sans copier-coller.

## Personnaliser

Tout se règle dans **`Config.luau`** :

- `UPGRADES` : nom, prix et revenu de chaque amélioration. Tu peux en ajouter autant que tu veux.
- `BASE_INCOME` : revenu de départ par seconde.
- `GAMEPASS_DOUBLE_CASH` : l'identifiant de ton Game Pass (Creator Hub → ton jeu → Monétisation → Passes).
- `CASH_PRODUCTS` : tes produits développeur, par exemple `[1234567890] = 1000` pour un pack de 1000 pièces.

## Idées d'extensions (sur demande client)

- Renaissance (« rebirth ») : remise à zéro en échange d'un multiplicateur permanent
- Objets physiques qui apparaissent dans la base du joueur à chaque achat
- Classement mondial des plus riches
- Récompenses quotidiennes et codes promo
