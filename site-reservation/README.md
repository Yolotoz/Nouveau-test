# Site avec réservation en ligne

Un site pour commerce (ici un barbier fictif) avec **prise de rendez-vous en ligne** et **espace gérant**.

🔗 **Démo en ligne :** https://yolotoz.github.io/Nouveau-test/site-reservation/public/
(espace gérant : bouton en bas de page, mot de passe `demo`)

## Pour les clients du commerce
1. Ils choisissent une prestation (prix et durée affichés)
2. Ils choisissent un jour : seuls les jours d'ouverture sont proposés
3. Ils choisissent une heure : seuls les créneaux vraiment libres sont proposés, en tenant compte de la durée de la prestation et de la pause déjeuner
4. Ils laissent leur nom et leur téléphone, et c'est réservé

## Pour le gérant
- Liste des rendez-vous à venir, classés par jour
- Statistiques : rendez-vous du jour, de la semaine et chiffre d'affaires prévu
- Appel du client en un clic et annulation d'un rendez-vous (le créneau se libère aussitôt)

## Sécurité
- **Impossible de réserver deux fois le même créneau** : le serveur revérifie chaque réservation
- Espace gérant protégé par mot de passe (cookie sécurisé, session de 12 h)
- Limitation des tentatives (anti-spam et anti-piratage du mot de passe)
- Les numéros de téléphone ne sont jamais visibles publiquement

## Adapter à un nouveau client
Tout se règle dans **`public/js/config.js`** : nom, adresse, prestations (nom, prix, durée), horaires avec pauses, jours de fermeture, délai minimum avant un rendez-vous, etc.

## Lancer le site

Il faut Node.js 22.13 ou plus. La base de données SQLite est intégrée à Node.js : rien d'autre à installer.

```bash
npm install
cp .env.example .env     # puis choisis un ADMIN_PASSWORD
npm start                # http://localhost:3000
npm test                 # 12 tests automatiques
```

## Mise en ligne pour un client
Le site a besoin d'un hébergeur Node.js **avec un disque permanent**, pour garder les réservations :
- **Railway** ou **Fly.io**, en ajoutant un « volume » (quelques euros par mois)
- ou un petit **VPS** (Hetzner, OVH…)

Indique `DATABASE_FILE` vers le volume, définis `ADMIN_PASSWORD`, et c'est en ligne.

## Mode démo
Sur GitHub Pages (ou en ajoutant `?demo` à l'adresse), le site fonctionne **sans serveur** : les réservations sont simulées et restent dans le navigateur du visiteur. C'est parfait pour montrer le site à un futur client.

## Structure

| Fichier | Rôle |
|---|---|
| `public/js/config.js` | Réglages du commerce |
| `public/js/core.js` | Règles de réservation (créneaux, validations), partagées par le site et le serveur |
| `public/js/api.js` | Communication avec le serveur, ou simulation en mode démo |
| `public/js/app.js` | Parcours de réservation |
| `public/js/admin.js` | Espace gérant |
| `server.js` | Serveur : API, sécurité, pages |
| `src/db.js` | Base de données |

## Idées d'extensions
- SMS ou e-mail de confirmation et de rappel (Twilio, Brevo…)
- Plusieurs employés, chacun avec son agenda
- Annulation par le client via un lien
- Acompte en ligne avec Stripe
