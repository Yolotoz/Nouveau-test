import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { Client, Events, GatewayIntentBits, MessageFlags, PermissionFlagsBits } from 'discord.js';
import { createSession, dueForReminder, expired, join, leave, parseTime } from './sessions.js';
import { SessionStore } from './store.js';
import { helpText, listEmbed, sessionMessage } from './view.js';

// Les heures tapées par les joueurs sont interprétées dans ce fuseau horaire
process.env.TZ = process.env.TIMEZONE || 'Europe/Paris';

if (!process.env.DISCORD_TOKEN) {
  console.error('DISCORD_TOKEN manquant : copie .env.example en .env et remplis-le.');
  process.exit(1);
}

const store = new SessionStore(process.env.DATA_FILE || path.resolve('data/sessions.json'));
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const ephemeral = (content) => ({ content, flags: MessageFlags.Ephemeral });

// Commandes slash ----------------------------------------------------------

async function handleCommand(interaction) {
  if (!interaction.inGuild()) {
    return interaction.reply(ephemeral('Ce bot s’utilise dans un serveur.'));
  }

  if (interaction.commandName === 'aide') {
    return interaction.reply(ephemeral(helpText));
  }

  if (interaction.commandName === 'sessions') {
    return interaction.reply({ embeds: [listEmbed(store.upcomingInGuild(interaction.guildId))] });
  }

  if (interaction.commandName === 'session') {
    const time = parseTime(interaction.options.getString('heure', true));
    if (!time) {
      return interaction.reply(ephemeral('Heure non reconnue. Exemples : `21h`, `21h30`, `21:30`, `dans 30 min`.'));
    }

    const session = createSession({
      id: randomUUID(),
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      creatorId: interaction.user.id,
      game: interaction.options.getString('jeu', true),
      time,
      slots: interaction.options.getInteger('places') ?? 5,
    });
    session.note = interaction.options.getString('note') ?? null;

    await interaction.reply(sessionMessage(session));
    const message = await interaction.fetchReply();
    session.messageId = message.id;
    store.set(session);
  }
}

// Boutons ------------------------------------------------------------------

async function handleButton(interaction) {
  const [scope, action, id] = interaction.customId.split(':');
  if (scope !== 'session') return;

  const session = store.get(id);
  if (!session) {
    return interaction.reply(ephemeral('Cette session est terminée ou introuvable.'));
  }

  let feedback;
  if (action === 'join') {
    const result = join(session, interaction.user.id);
    feedback = result.ok
      ? result.status === 'joined'
        ? '✅ Tu es inscrit !'
        : "⏳ C'est complet : tu es en liste d'attente."
      : result.reason;
  } else if (action === 'leave') {
    const result = leave(session, interaction.user.id);
    feedback = result.ok ? 'Tu as quitté la session.' : result.reason;
    if (result.promoted) {
      interaction.channel
        ?.send(`🎉 <@${result.promoted}>, une place s'est libérée pour **${session.game}** : tu es inscrit !`)
        .catch(() => {});
    }
  } else if (action === 'cancel') {
    const isModerator = interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages);
    if (interaction.user.id !== session.creatorId && !isModerator) {
      return interaction.reply(ephemeral('Seul l’organisateur ou un modérateur peut annuler.'));
    }
    session.cancelled = true;
    feedback = 'Session annulée.';
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
      const who = session.players.map((p) => `<@${p}>`).join(' ');
      await channel.send(
        `⏰ **${session.game}** commence <t:${Math.floor(session.time / 1000)}:R> ! ${who}`,
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
    const reply = ephemeral('Oups, une erreur est survenue. Réessaie dans un instant.');
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
