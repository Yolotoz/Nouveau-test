import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { Client, Events, GatewayIntentBits, MessageFlags, PermissionFlagsBits } from 'discord.js';
import { createSession, dueForReminder, expired, join, leave, parseTime } from './sessions.js';
import { SessionStore } from './store.js';
import { helpText, listEmbed, sessionMessage } from './view.js';
import { langFrom, t } from './i18n.js';

// Les heures tapées par les joueurs sont interprétées dans ce fuseau horaire
process.env.TZ = process.env.TIMEZONE || 'Europe/Paris';

if (!process.env.DISCORD_TOKEN) {
  console.error('DISCORD_TOKEN manquant : copie .env.example en .env et remplis-le.');
  process.exit(1);
}

const store = new SessionStore(process.env.DATA_FILE || path.resolve('data/sessions.json'));
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const ephemeral = (content) => ({ content, flags: MessageFlags.Ephemeral });

// Langue des réponses privées : celle du joueur. Langue des messages publics : celle du serveur.
const userLang = (interaction) => langFrom(interaction.locale);
const serverLang = (interaction) => langFrom(interaction.guildLocale ?? interaction.locale);

// Commandes slash ----------------------------------------------------------

async function handleCommand(interaction) {
  const lang = userLang(interaction);
  if (!interaction.inGuild()) {
    return interaction.reply(ephemeral(t(lang, 'reply.guildOnly')));
  }

  if (interaction.commandName === 'help') {
    return interaction.reply(ephemeral(helpText(lang)));
  }

  if (interaction.commandName === 'sessions') {
    return interaction.reply({ embeds: [listEmbed(store.upcomingInGuild(interaction.guildId), serverLang(interaction))] });
  }

  if (interaction.commandName === 'session') {
    const time = parseTime(interaction.options.getString('time', true));
    if (!time) {
      return interaction.reply(ephemeral(t(lang, 'reply.badTime')));
    }

    const session = createSession({
      id: randomUUID(),
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      creatorId: interaction.user.id,
      game: interaction.options.getString('game', true),
      time,
      slots: interaction.options.getInteger('slots') ?? 5,
      note: interaction.options.getString('note'),
      lang: serverLang(interaction),
    });

    await interaction.reply(sessionMessage(session));
    const message = await interaction.fetchReply();
    session.messageId = message.id;
    store.set(session);
  }
}

// Boutons ------------------------------------------------------------------

async function handleButton(interaction) {
  const lang = userLang(interaction);
  const [scope, action, id] = interaction.customId.split(':');
  if (scope !== 'session') return;

  const session = store.get(id);
  if (!session) {
    return interaction.reply(ephemeral(t(lang, 'reply.notFound')));
  }

  let feedback;
  if (action === 'join') {
    const result = join(session, interaction.user.id);
    feedback = result.ok
      ? t(lang, result.status === 'joined' ? 'reply.joined' : 'reply.waitlist')
      : t(lang, `reason.${result.reason}`);
  } else if (action === 'leave') {
    const result = leave(session, interaction.user.id);
    feedback = result.ok ? t(lang, 'reply.left') : t(lang, `reason.${result.reason}`);
    if (result.promoted) {
      interaction.channel
        ?.send(t(session.lang ?? 'fr', 'notice.promoted', { user: `<@${result.promoted}>`, game: session.game }))
        .catch(() => {});
    }
  } else if (action === 'cancel') {
    const isModerator = interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages);
    if (interaction.user.id !== session.creatorId && !isModerator) {
      return interaction.reply(ephemeral(t(lang, 'reply.notOwner')));
    }
    session.cancelled = true;
    feedback = t(lang, 'reply.cancelled');
  } else {
    return;
  }

  store.set(session);
  await interaction.update(sessionMessage(session));
  await interaction.followUp(ephemeral(feedback));
}

// Rappels et nettoyage (toutes les 30 secondes) ---------------------------

async function tick() {
  for (const session of dueForReminder(store.all())) {
    session.reminded = true;
    store.set(session);
    try {
      const channel = await client.channels.fetch(session.channelId);
      await channel.send(
        t(session.lang ?? 'fr', 'notice.reminder', {
          game: session.game,
          when: `<t:${Math.floor(session.time / 1000)}:R>`,
          players: session.players.map((p) => `<@${p}>`).join(' '),
        }),
      );
    } catch (error) {
      console.error(`[rappel] Session ${session.id} :`, error.message);
    }
  }
  for (const session of expired(store.all())) store.delete(session.id);
}

// Démarrage ----------------------------------------------------------------

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) await handleCommand(interaction);
    else if (interaction.isButton()) await handleButton(interaction);
  } catch (error) {
    console.error('[interaction]', error);
    const reply = ephemeral(t(userLang(interaction), 'reply.error'));
    if (interaction.isRepliable()) {
      (interaction.replied || interaction.deferred ? interaction.followUp(reply) : interaction.reply(reply)).catch(
        () => {},
      );
    }
  }
});

client.once(Events.ClientReady, (ready) => {
  console.log(`Connecté en tant que ${ready.user.tag} sur ${ready.guilds.cache.size} serveur(s).`);
  setInterval(() => tick().catch((e) => console.error('[tick]', e)), 30_000);
  tick().catch((e) => console.error('[tick]', e));
});

client.login(process.env.DISCORD_TOKEN);
