// Commandes slash. Noms et descriptions en anglais par défaut,
// traduits automatiquement par Discord pour les joueurs francophones.

import { SlashCommandBuilder } from 'discord.js';
import { MAX_SLOTS } from './sessions.js';

const fr = (text) => ({ fr: text });

export const commands = [
  new SlashCommandBuilder()
    .setName('session')
    .setDescription('Organize a gaming session')
    .setDescriptionLocalizations(fr('Organiser une session de jeu'))
    .addStringOption((o) =>
      o
        .setName('game')
        .setNameLocalizations(fr('jeu'))
        .setDescription('e.g. Valorant, Fortnite, Roblox…')
        .setDescriptionLocalizations(fr('Ex : Valorant, Fortnite, Roblox…'))
        .setRequired(true)
        .setMaxLength(100),
    )
    .addStringOption((o) =>
      o
        .setName('time')
        .setNameLocalizations(fr('heure'))
        .setDescription('e.g. 9pm, 9:30pm, 21:30, in 30 min')
        .setDescriptionLocalizations(fr('Ex : 21h, 21h30, 21:30, dans 30 min'))
        .setRequired(true)
        .setMaxLength(20),
    )
    .addIntegerOption((o) =>
      o
        .setName('slots')
        .setNameLocalizations(fr('places'))
        .setDescription('Number of players (including you)')
        .setDescriptionLocalizations(fr('Nombre de joueurs (toi compris)'))
        .setMinValue(2)
        .setMaxValue(MAX_SLOTS),
    )
    .addStringOption((o) =>
      o
        .setName('note')
        .setDescription('e.g. ranked, chill, tournament…')
        .setDescriptionLocalizations(fr('Ex : ranked, chill, tournoi…'))
        .setMaxLength(200),
    ),

  new SlashCommandBuilder()
    .setName('sessions')
    .setDescription('See the upcoming sessions on this server')
    .setDescriptionLocalizations(fr('Voir les prochaines sessions du serveur')),

  new SlashCommandBuilder()
    .setName('help')
    .setNameLocalizations(fr('aide'))
    .setDescription('How to use the bot')
    .setDescriptionLocalizations(fr('Comment utiliser le bot')),
].map((command) => command.toJSON());
