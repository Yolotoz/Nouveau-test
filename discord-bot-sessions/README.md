# Bot Discord « Sessions de jeu »

Un bot qui règle le problème de tous les groupes de joueurs : **organiser une partie sans 50 messages « t'es là ce soir ? »**.

```
/session jeu:Valorant heure:21h places:5 note:ranked     (français)
/session game:Valorant time:9pm slots:5 note:ranked      (English)
```

Le bot publie une carte avec des boutons **Rejoindre / Quitter / Annuler**, et s'occupe du reste :

- ✅ **Inscriptions en un clic**, avec le nombre de places
- ⏳ **Liste d'attente** : quand quelqu'un quitte, le suivant récupère sa place et il est prévenu
- ⏰ **Rappel automatique** 10 minutes avant, qui mentionne tous les inscrits
- 🕘 **Heure affichée dans le fuseau de chaque joueur** (grâce aux horodatages Discord)
- 🛡️ Seul l'organisateur ou un modérateur peut annuler
- 💾 Les sessions sont sauvegardées et survivent à un redémarrage du bot
- 🌍 **Bilingue français / anglais** : le bot détecte la langue du serveur (messages publics) et de chaque joueur (réponses privées). Les commandes s'affichent aussi dans la bonne langue (`/aide` ou `/help`). Pour forcer une langue : `BOT_LANGUAGE=fr` ou `en` dans `.env`.

Heures acceptées : `21h`, `21h30`, `21:30`, `9pm`, `9:30pm`, `dans 30 min`, `in 30 min`, `45min`.

Autres commandes : `/sessions` (prochaines sessions du serveur) et `/aide` (`/help`).

## Installation

Il faut [Node.js](https://nodejs.org) 18 ou plus.

1. Sur le [Discord Developer Portal](https://discord.com/developers/applications), crée une application, puis dans l'onglet **Bot**, récupère le token.
2. Invite le bot : onglet **OAuth2 → URL Generator**, coche `bot` et `applications.commands`, puis les permissions **Send Messages** et **Embed Links**. Ouvre le lien généré.
3. Dans ce dossier :
   ```bash
   npm install
   cp .env.example .env   # puis remplis DISCORD_TOKEN, CLIENT_ID (et GUILD_ID pour tester)
   npm run deploy         # enregistre les commandes slash
   npm start              # lance le bot
   ```

Pour qu'il tourne 24 h/24, il faut l'héberger sur un petit serveur (VPS, Railway, fly.io…).

## Tests

```bash
npm test
```

Les tests vérifient la lecture des heures (formats français et anglais), les inscriptions, la liste d'attente, les rappels, les traductions et le format des messages, sans connexion à Discord.

## Structure

| Fichier | Rôle |
|---|---|
| `src/index.js` | Connexion à Discord, commandes, boutons, rappels |
| `src/sessions.js` | Logique pure : heures, inscriptions, liste d'attente |
| `src/view.js` | Apparence des messages (cartes et boutons) |
| `src/i18n.js` | Traductions français / anglais |
| `src/store.js` | Sauvegarde des sessions dans un fichier JSON |
| `src/commands.js` | Définition des commandes slash |
| `src/deploy-commands.js` | Enregistrement des commandes auprès de Discord |

## Idées d'extensions (version premium)

- Sessions récurrentes (« tous les vendredis à 21h »)
- Rappels en message privé et rappels multiples (1 h, 10 min)
- Statistiques : joueurs les plus présents, taux d'annulation
- Rôle mentionné automatiquement selon le jeu
