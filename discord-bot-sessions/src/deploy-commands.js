// À lancer une fois (et après chaque modification des commandes) : npm run deploy
import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { commands } from './commands.js';

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = process.env;
if (!DISCORD_TOKEN || !CLIENT_ID) {
  console.error('DISCORD_TOKEN et CLIENT_ID sont requis dans .env');
  process.exit(1);
}

const rest = new REST().setToken(DISCORD_TOKEN);

// Avec GUILD_ID : commandes disponibles tout de suite sur ce serveur (idéal pour tester).
// Sans GUILD_ID : commandes disponibles partout (peut prendre jusqu'à 1 heure).
const route = GUILD_ID ? Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID) : Routes.applicationCommands(CLIENT_ID);

const result = await rest.put(route, { body: commands });
console.log(`${result.length} commande(s) enregistrée(s) ${GUILD_ID ? 'sur le serveur de test' : 'globalement'}.`);
