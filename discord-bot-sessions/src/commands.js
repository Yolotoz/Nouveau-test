import { SlashCommandBuilder } from 'discord.js';
import { MAX_SLOTS } from './sessions.js';

export const commands = [
  new SlashCommandBuilder()
    .setName('session')
    .setDescription('Organiser une session de jeu')
    .addStringOption((o) =>
      o.setName('jeu').setDescription('Ex : Valorant, Fortnite, Roblox…').setRequired(true).setMaxLength(100),
    )
    .addStringOption((o) =>
      o.setName('heure').setDescription('Ex : 21h, 21h30, 21:30, dans 30 min').setRequired(true).setMaxLength(20),
    )
    .addIntegerOption((o) =>
      o.setName('places').setDescription('Nombre de joueurs (toi compris)').setMinValue(2).setMaxValue(MAX_SLOTS),
    )
    .addStringOption((o) =>
      o.setName('note').setDescription('Ex : ranked, chill, tournoi…').setMaxLength(200),
    ),

  new SlashCommandBuilder().setName('sessions').setDescription('Voir les prochaines sessions du serveur'),

  new SlashCommandBuilder().setName('aide').setDescription('Comment utiliser le bot'),
].map((command) => command.toJSON());
