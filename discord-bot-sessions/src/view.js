// Apparence des messages : carte de session et boutons.

import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import { t } from './i18n.js';

const COLOR_OPEN = 0x2ecc71;
const COLOR_FULL = 0xf1c40f;
const COLOR_CANCELLED = 0x95a5a6;

const ts = (ms, style) => `<t:${Math.floor(ms / 1000)}:${style}>`;
const mentions = (ids) => (ids.length ? ids.map((id) => `<@${id}>`).join('\n') : '—');
const langOf = (session) => session.lang ?? 'fr'; // sessions créées avant la version bilingue

export function sessionEmbed(session) {
  const lang = langOf(session);
  const full = session.players.length >= session.slots;
  const embed = new EmbedBuilder()
    .setTitle(`${session.cancelled ? '❌ ' : '🎮 '}${session.game}`)
    .setColor(session.cancelled ? COLOR_CANCELLED : full ? COLOR_FULL : COLOR_OPEN)
    .addFields(
      { name: t(lang, 'card.time'), value: `${ts(session.time, 'F')}\n${ts(session.time, 'R')}`, inline: true },
      {
        name: t(lang, 'card.slots'),
        value: `${session.players.length} / ${session.slots}${full ? ` — ${t(lang, 'card.full')}` : ''}`,
        inline: true,
      },
      { name: t(lang, 'card.players'), value: mentions(session.players) },
    )
    .setFooter({ text: t(lang, session.cancelled ? 'card.cancelled' : 'card.footer') });

  if (session.note) embed.setDescription(session.note);
  if (session.waitlist.length) embed.addFields({ name: t(lang, 'card.waitlist'), value: mentions(session.waitlist) });
  return embed;
}

export function sessionButtons(session) {
  const lang = langOf(session);
  const disabled = session.cancelled;
  const full = session.players.length >= session.slots;
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`session:join:${session.id}`)
        .setLabel(t(lang, full ? 'button.waitlist' : 'button.join'))
        .setEmoji(full ? '⏳' : '✅')
        .setStyle(ButtonStyle.Success)
        .setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId(`session:leave:${session.id}`)
        .setLabel(t(lang, 'button.leave'))
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId(`session:cancel:${session.id}`)
        .setLabel(t(lang, 'button.cancel'))
        .setStyle(ButtonStyle.Danger)
        .setDisabled(disabled),
    ),
  ];
}

export function sessionMessage(session) {
  return { embeds: [sessionEmbed(session)], components: sessionButtons(session) };
}

export function listEmbed(sessions, lang) {
  const embed = new EmbedBuilder().setTitle(t(lang, 'list.title')).setColor(COLOR_OPEN);
  if (!sessions.length) return embed.setDescription(t(lang, 'list.empty'));
  return embed.setDescription(
    sessions
      .slice(0, 15)
      .map((s) => `**${s.game}** — ${ts(s.time, 'R')} — ${s.players.length}/${s.slots} — <#${s.channelId}>`)
      .join('\n'),
  );
}

export const helpText = (lang) => t(lang, 'help');
