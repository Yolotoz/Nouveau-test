// Apparence des messages : carte de session et boutons.

import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { REMINDER_MINUTES } from './sessions.js';

const COLOR_OPEN = 0x2ecc71;
const COLOR_FULL = 0xf1c40f;
const COLOR_CANCELLED = 0x95a5a6;

const ts = (ms, style) => `<t:${Math.floor(ms / 1000)}:${style}>`;
const mentions = (ids) => (ids.length ? ids.map((id) => `<@${id}>`).join('\n') : '—');

export function sessionEmbed(session) {
  const full = session.players.length >= session.slots;
  const embed = new EmbedBuilder()
    .setTitle(`${session.cancelled ? '❌ ' : '🎮 '}${session.game}`)
    .setColor(session.cancelled ? COLOR_CANCELLED : full ? COLOR_FULL : COLOR_OPEN)
    .addFields(
      { name: '🕘 Heure', value: `${ts(session.time, 'F')}\n${ts(session.time, 'R')}`, inline: true },
      { name: '👥 Places', value: `${session.players.length} / ${session.slots}${full ? ' — complet' : ''}`, inline: true },
      { name: 'Joueurs', value: mentions(session.players) },
    )
    .setFooter({ text: session.cancelled ? 'Session annulée' : `Rappel ${REMINDER_MINUTES} min avant le début` });

  if (session.note) embed.setDescription(session.note);
  if (session.waitlist.length) embed.addFields({ name: "⏳ Liste d'attente", value: mentions(session.waitlist) });
  return embed;
}

export function sessionButtons(session) {
  const disabled = session.cancelled;
  const full = session.players.length >= session.slots;
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`session:join:${session.id}`)
        .setLabel(full ? "Liste d'attente" : 'Rejoindre')
        .setEmoji(full ? '⏳' : '✅')
        .setStyle(ButtonStyle.Success)
        .setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId(`session:leave:${session.id}`)
        .setLabel('Quitter')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId(`session:cancel:${session.id}`)
        .setLabel('Annuler')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(disabled),
    ),
  ];
}

export function sessionMessage(session) {
  return { embeds: [sessionEmbed(session)], components: sessionButtons(session) };
}

export function listEmbed(sessions) {
  const embed = new EmbedBuilder().setTitle('📅 Prochaines sessions').setColor(COLOR_OPEN);
  if (!sessions.length) return embed.setDescription('Aucune session prévue. Lance-en une avec `/session` !');
  return embed.setDescription(
    sessions
      .slice(0, 15)
      .map((s) => `**${s.game}** — ${ts(s.time, 'R')} — ${s.players.length}/${s.slots} — <#${s.channelId}>`)
      .join('\n'),
  );
}

export const helpText = [
  '**🎮 Bot Sessions — mode d’emploi**',
  '`/session jeu:Valorant heure:21h places:5` → crée une session avec boutons d’inscription',
  '`/sessions` → liste les prochaines sessions du serveur',
  '',
  '• Quand c’est complet, les suivants passent en **liste d’attente** et récupèrent une place si quelqu’un quitte.',
  '• Les inscrits reçoivent un **rappel 10 minutes avant**.',
  '• Seul l’organisateur (ou un modérateur) peut annuler.',
].join('\n');
