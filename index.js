const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
  SlashCommandBuilder,
} = require('discord.js');
const express = require('express');
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.TOKEN || process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID || null;
const PORT = Number(process.env.PORT || 3000);
const REQUIRED_ROLE_NAME = 'Celler+';
const TRACKING_STATE_PATH = path.join(__dirname, 'tracking-state.json');
const SET_CHANNEL_ADMIN_ID = '515590271359123477';
const REACT_EMOJI_IDS = [
  '1475829091063038082',
  '1475828857201360998',
  '1475828661432356965',
  '1475828747814047844',
  '1475828789765476494',
  '1475828913547776114',
  '1475828943016689664',
  '1475828973941559388',
  '1482497799563251904',
  '1475829879009181880',
  '1487837349168808136',
  '1487837381938642984',
  '1487837406177525832',
];
const COOLDOWN_ITEMS = [
  { id: 'b_vv', label: 'B - VV', emoji: '💰', row: 0 },
  { id: 'b_kiste', label: 'B - Hemmelig Kiste', emoji: '🎁', row: 0 },
  { id: 'b_pvp', label: 'B - PvP Mine', emoji: '⚔️', row: 0 },
  { id: 'bp_vv', label: 'B+ - VV', emoji: '💎', row: 1 },
  { id: 'bp_pvp', label: 'B+ - PvP Mine', emoji: '⛏️', row: 1 },
];
const DEFAULT_COOLDOWN_SECONDS = 20 * 60;

if (!TOKEN || !CLIENT_ID) {
  console.error('Mangler miljøvariabler: TOKEN/DISCORD_TOKEN eller CLIENT_ID');
  process.exit(1);
}

const app = express();
app.get('/', (_req, res) => {
  res.status(200).send('Bot er online ✅');
});
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});
app.listen(PORT, () => {
  console.log(`HTTP keep-alive kører på port ${PORT}`);
});

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  partials: [Partials.Message, Partials.Channel],
});

const DELETE_AFTER_EXPIRED_MS = 60 * 60 * 1000; // 1 time
const activeCountdowns = new Map();
const trackedCells = new Map();
const trackerMessageIdsByChannel = new Map();
const restrictedChannelIds = new Set();
const cooldownPanels = new Map();

function loadTrackingState() {
  try {
    if (!fs.existsSync(TRACKING_STATE_PATH)) return;
    const parsed = JSON.parse(fs.readFileSync(TRACKING_STATE_PATH, 'utf8'));
    const now = Date.now();

    if (Array.isArray(parsed.activeCells)) {
      for (const entry of parsed.activeCells) {
        if (!entry?.key || !entry?.channelId || !entry?.messageId || !entry?.cellName || !entry?.endTimeMs) continue;
        if (entry.endTimeMs <= now) continue;
        trackedCells.set(entry.key, entry);
      }
    }

    if (parsed.trackerMessageIdsByChannel && typeof parsed.trackerMessageIdsByChannel === 'object') {
      for (const [channelId, messageId] of Object.entries(parsed.trackerMessageIdsByChannel)) {
        if (channelId && messageId) trackerMessageIdsByChannel.set(channelId, messageId);
      }
    }
    if (Array.isArray(parsed.restrictedChannelIds)) {
      for (const channelId of parsed.restrictedChannelIds) {
        if (channelId) restrictedChannelIds.add(channelId);
      }
    }
  } catch (error) {
    console.error('Kunne ikke læse tracking-state:', error.message);
  }
}

function persistTrackingState() {
  try {
    const payload = {
      activeCells: Array.from(trackedCells.values()),
      trackerMessageIdsByChannel: Object.fromEntries(trackerMessageIdsByChannel.entries()),
      restrictedChannelIds: Array.from(restrictedChannelIds.values()),
    };
    fs.writeFileSync(TRACKING_STATE_PATH, JSON.stringify(payload, null, 2), 'utf8');
  } catch (error) {
    console.error('Kunne ikke gemme tracking-state:', error.message);
  }
}

function parseDuration(input) {
  if (!input) return 0;
  const normalized = input.toLowerCase().replace(/\s+/g, '');
  const matches = normalized.match(/\d+[dhms]/g);
  if (!matches) return 0;

  let totalMs = 0;
  for (const token of matches) {
    const value = Number.parseInt(token.slice(0, -1), 10);
    const unit = token.slice(-1);

    if (!Number.isFinite(value) || value <= 0) continue;
    if (unit === 'd') totalMs += value * 24 * 60 * 60 * 1000;
    if (unit === 'h') totalMs += value * 60 * 60 * 1000;
    if (unit === 'm') totalMs += value * 60 * 1000;
    if (unit === 's') totalMs += value * 1000;
  }

  return totalMs;
}

function derivePlacement(cellName) {
  const normalized = cellName.trim().toLowerCase().replace(/\s+/g, '');
  const match = normalized.match(/^([a-z]+)(\d+)$/);
  if (!match) return 'Ukendt placering';

  const [, prefix, rawNumber] = match;
  const number = Number.parseInt(rawNumber, 10);
  const inRange = (min, max) => number >= min && number <= max;

  // A blok
  if (prefix === 'tpre') {
    if (inRange(1, 19)) return 'Titan gang';
    if (inRange(20, 24)) return 'VV side';
    if (inRange(25, 31)) return 'Casino side';
  }
  if (prefix === 'fc') {
    if (inRange(1, 50)) return 'Gederne Nedre (Portal)';
    if (inRange(66, 105)) return 'Gederne Øvre (Portal)';
    if (inRange(51, 53) || inRange(300, 325)) return 'A+';
  }
  if (prefix === 'apre') {
    if (inRange(1, 36)) return 'Gul stue (Portal)';
    if (inRange(37, 74)) return 'Hønsene (Portal)';
    if (inRange(75, 110)) return 'Kakerlakkene (Portal)';
    if (inRange(111, 150)) return 'Kyllingerne (Portal)';
    if (inRange(151, 230)) return 'Aberne (Portal)';
    if (inRange(231, 260)) return 'Æslerne (Portal)';
    if (inRange(261, 310)) return 'Ænderne (Portal)';
    if (inRange(311, 346)) return 'Ulvene (Portal)';
    if (inRange(347, 382)) return 'Rød stue (Portal)';
    if (inRange(383, 392)) return 'Bjørnene - 1. casino gang';
    if (inRange(393, 402)) return 'Pandaerne - 2. casino gang';
    if (inRange(403, 412)) return 'Koalaerne - 3. casino gang';
    if (inRange(413, 422)) return 'Isbjørnene - 3. vv gang';
    if (inRange(423, 432)) return 'Bubbibjørnene - 2. vv gang';
    if (inRange(433, 442)) return 'Hulebjørnene - 1. vv gang';
    if (inRange(443, 454)) return 'Security gang';
    if (number === 25086 || number === 25333) return 'BO celler';
  }
  if (prefix === 'a') {
    if (inRange(1, 144)) return 'Grisene (Portal)';
    if (inRange(200, 343)) return 'Koalaerne (Portal)';
    if (inRange(400, 543)) return 'Pelikanerne (Portal)';
    if (inRange(600, 671)) return 'Bacon (Portal)';
    if (inRange(800, 935)) return 'Bamserne (Portal)';
    if (inRange(1000, 1167)) return 'Flodhestene (Portal)';
    if (inRange(1200, 1347)) return 'Skilpadderne (Portal)';
    if (inRange(1400, 1567)) return 'Tigerene (Portal)';
    if (inRange(1600, 1743)) return 'Slangerne (Portal)';
    if (inRange(1744, 1751)) return 'Midter celler';
  }

  // B blok
  if (prefix === 'bpre') {
    if (inRange(1, 40)) return 'Portal under Sort cellegang';
    if (inRange(101, 230)) return 'Portal under Hvid cellegang';
    if (inRange(231, 337)) return 'Portal 1';
    if (inRange(540, 637)) return 'Portal 3';
    if (inRange(638, 766)) return 'Portal 4';
    if (inRange(767, 831)) return 'Portal 5';
    if (inRange(832, 928)) return 'Portal 6';
    if (inRange(929, 1025)) return 'Portal 7';
  }
  if (prefix === 'fcb') {
    if (inRange(1, 96)) return 'Fcoin celler';
  }
  if (prefix === 'b') {
    if (inRange(1, 272)) return 'Sort portal';
    if (inRange(326, 491)) return 'Hvid celle gang';
    if (inRange(495, 718)) return 'Portal 1';
    if (inRange(1167, 1437)) return 'Portal 2';
    if (inRange(1438, 1661)) return 'Portal 8';
    if (inRange(1662, 1670)) return 'Over vagt stue';
    if (inRange(1671, 1717)) return 'Bag minerne';
    if (inRange(1718, 1737)) return 'Bag væggen i sort portal';
    if (inRange(1741, 1764)) return 'BO Celler';
  }
  if (prefix === 'bk') {
    if (inRange(1, 30)) return 'Kloak-Celler';
  }

  // C blok
  if (prefix === 'cpre') {
    if (inRange(1, 384)) return 'MadChemist Portal';
  }
  if (prefix === 'c') {
    if (inRange(1, 96)) return 'Cellegang 1';
    if (inRange(97, 192)) return 'Cellegang 2';
    if (inRange(193, 288)) return 'Cellegang 3';
    if (inRange(289, 384)) return 'Cellegang 4';
    if (inRange(385, 480)) return 'Cellegang 5';
    if (inRange(481, 576)) return 'Cellegang 6';
    if (inRange(578, 673)) return 'Cellegang 7';
    if (inRange(1250, 1537)) return 'Gamle Normal Portal';
    if (inRange(1826, 2114)) return 'Nye Normal Portal';
    if (inRange(2133, 2156)) return 'Casino Kloak';
  }

  return 'Ukendt placering';
}

function getBlock(cellName) {
  const normalized = cellName.trim().toLowerCase().replace(/\s+/g, '');

  if (/^(b|bpre|fcb|bk)\d+$/.test(normalized)) return 'B';
  if (/^(c|cpre)\d+$/.test(normalized)) return 'C';
  if (/^(a|apre|tpre|fc)\d+$/.test(normalized)) return 'A';
  return null;
}

function getEmbedColor(cellName, expired) {
  const block = getBlock(cellName);
  if (expired) return 0x992d22;
  if (block === 'C') return 0xed4245; // rød
  if (block === 'B') return 0x00ffff; // cyan
  return 0x32cd32; // lime (default/A)
}

function formatRemaining(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(' ');
}

function formatMMSSFromSeconds(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function formatMinSecText(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return `${min} min / ${sec} sekunder`;
}

function getCooldownItemById(itemId) {
  return COOLDOWN_ITEMS.find((item) => item.id === itemId) || null;
}

function buildCooldownPanelEmbed(panel) {
  const nowSec = Math.floor(Date.now() / 1000);
  const active = Object.entries(panel.cooldowns)
    .filter(([, value]) => value.end > nowSec)
    .map(([itemId, value]) => {
      const item = getCooldownItemById(itemId);
      const left = value.end - nowSec;
      return { item, user: value.user, left, end: value.end };
    })
    .filter((entry) => entry.item)
    .sort((a, b) => a.left - b.left);

  const embed = new EmbedBuilder()
    .setColor(0x9b59b6)
    .setTitle('🕒 Cooldowns – B & B+')
    .setDescription('Live oversigt over aktive cooldowns.');

  if (active.length === 0) {
    embed.addFields({ name: 'Status', value: 'Der er ingen aktive cooldowns.' }, { name: '\u200B', value: '\u200B' });
    return embed;
  }

  const lines = [];
  for (const entry of active) {
    const block = entry.item.label.startsWith('B+ ') ? 'B+' : 'B';
    lines.push(
      `${entry.item.emoji} **${entry.item.label}**\n\`\`\`Område: ${entry.item.label}\nBlok: ${block}\nStartet af: ${
        entry.user
      }\nKlar om: ${formatMinSecText(entry.left)}\`\`\``,
    );
  }
  embed.addFields({ name: 'Aktive cooldowns (kortest først)', value: lines.join('\n') }, { name: '\u200B', value: '\u200B' });
  return embed;
}

function buildCooldownPanelRows(panel) {
  const nowSec = Math.floor(Date.now() / 1000);
  const rows = [new ActionRowBuilder(), new ActionRowBuilder()];

  for (const item of COOLDOWN_ITEMS) {
    const value = panel.cooldowns[item.id];
    const active = value.end > nowSec;
    const left = active ? value.end - nowSec : value.durationSec;
    const button = new ButtonBuilder()
      .setCustomId(`cooldown:${panel.messageId}:${item.id}`)
      .setStyle(active ? ButtonStyle.Danger : ButtonStyle.Success)
      .setLabel(active ? `🛑 Stop ${item.label} (${formatMMSSFromSeconds(left)})` : `🟢 Start ${item.label}`);
    rows[item.row].addComponents(button);
  }

  return rows;
}

async function renderCooldownPanel(panel) {
  const channel = await client.channels.fetch(panel.channelId);
  if (!channel?.isTextBased()) return false;

  const message = await channel.messages.fetch(panel.messageId);
  await message.edit({
    embeds: [buildCooldownPanelEmbed(panel)],
    components: buildCooldownPanelRows(panel),
  });
  return true;
}

function clearCooldownPanel(panel) {
  if (panel?.interval) clearInterval(panel.interval);
  if (panel?.messageId) cooldownPanels.delete(panel.messageId);
}

function getCooldownPanelForChannel(channelId) {
  for (const panel of cooldownPanels.values()) {
    if (panel.channelId === channelId) return panel;
  }
  return null;
}

function buildCountdownEmbed({
  cellName,
  note,
  imageUrl,
  createdBy,
  endTimeMs,
  createdAtMs,
  deleteAtMs = null,
  expired = false,
}) {
  const relativeEnd = `<t:${Math.floor(endTimeMs / 1000)}:R>`;
  const absoluteEnd = `<t:${Math.floor(endTimeMs / 1000)}:f>`;
  const remaining = endTimeMs - Date.now();
  const deleteAtText = deleteAtMs
    ? `\nSlettes automatisk <t:${Math.floor(deleteAtMs / 1000)}:R> (<t:${Math.floor(deleteAtMs / 1000)}:f>)`
    : '';

  const embed = new EmbedBuilder()
    .setTitle('⏳ Celle Nedtælling')
    .setColor(getEmbedColor(cellName, expired))
    .addFields(
      { name: 'Celle', value: cellName, inline: true },
      { name: 'Placering', value: derivePlacement(cellName), inline: true },
      {
        name: 'Tid tilbage',
        value: expired
          ? `❌ Udløbet (${absoluteEnd})`
          : `${formatRemaining(remaining)}\nUdløber ${relativeEnd} (${absoluteEnd})${deleteAtText}`,
        inline: false,
      },
      { name: 'Noter', value: note || 'Ingen noter', inline: false },
    )
    .setFooter({ text: `Oprettet af: ${createdBy}` })
    .setTimestamp(createdAtMs);

  if (imageUrl) {
    embed.setImage(imageUrl);
  }

  return embed;
}

function buildTrackingEmbed(channelId) {
  const now = Date.now();
  const sortedEntries = Array.from(trackedCells.values())
    .filter((entry) => entry.channelId === channelId && entry.endTimeMs > now)
    .sort((a, b) => a.endTimeMs - b.endTimeMs);

  const top10 = sortedEntries.slice(0, 10);
  const lines = top10.map((entry, index) => {
    const unix = Math.floor(entry.endTimeMs / 1000);
    return `${index + 1}. **${entry.cellName}** (udløber <t:${unix}:R> / <t:${unix}:f>) [Klik for at finde celle embed](${entry.messageUrl})`;
  });

  const description = lines.length > 0 ? lines.join('\n') : 'Ingen aktive celler lige nu.';

  return new EmbedBuilder()
    .setColor(0x9b59b6)
    .setTitle('Udløbne celler 1-10')
    .setDescription(description)
    .setFooter({ text: `Der er oprettet tracking på ${sortedEntries.length} celler.` });
}

async function refreshTrackingEmbed(channel) {
  try {
    const savedMessageId = trackerMessageIdsByChannel.get(channel.id);
    if (savedMessageId) {
      try {
        const oldMessage = await channel.messages.fetch(savedMessageId);
        await oldMessage.delete();
      } catch {
        // Ignorer hvis gammel tracker-besked ikke findes længere.
      }
    }

    const trackerMessage = await channel.send({ embeds: [buildTrackingEmbed(channel.id)] });
    trackerMessageIdsByChannel.set(channel.id, trackerMessage.id);
    persistTrackingState();
  } catch (error) {
    console.error('Kunne ikke opdatere tracking-embed:', error.message);
  }
}

function sendExpiryReminder({ message, roleId, cellName, endTimeMs, label }) {
  return message.channel.send({
    content: `<@&${roleId}> Cellen **${cellName}** udløber om **${label}** (udløber <t:${Math.floor(
      endTimeMs / 1000,
    )}:t>).`,
    allowedMentions: { roles: [roleId] },
  });
}

async function editCountdownMessage(channel, messageId, embed) {
  try {
    const liveMessage = await channel.messages.fetch(messageId);
    await liveMessage.edit({ embeds: [embed] });
    return true;
  } catch (error) {
    console.error('Kunne ikke edit countdown-besked:', error.message);
    return false;
  }
}

function clearCountdownTimers(key) {
  const timers = activeCountdowns.get(key);
  if (!timers) return;

  if (timers.tickInterval) clearInterval(timers.tickInterval);
  if (timers.deleteTimeout) clearTimeout(timers.deleteTimeout);
  for (const reminderTimeout of timers.reminderTimeouts) clearTimeout(reminderTimeout);
  activeCountdowns.delete(key);
}

async function registerSlashCommand() {
  const celleCommand = new SlashCommandBuilder()
    .setName('celle')
    .setDescription('Opret celle nedtælling')
    .addStringOption((option) =>
      option
        .setName('celle')
        .setDescription('Celle nummer/navn, fx apre89')
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('tid')
        .setDescription('Varighed fx 2h 22m, 45m eller 1d2h')
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('note')
        .setDescription('Note om cellen')
        .setRequired(false),
    )
    .addAttachmentOption((option) =>
      option
        .setName('billede')
        .setDescription('Vedhæft et billede')
        .setRequired(false),
    );
  const reactCommand = new SlashCommandBuilder().setName('react').setDescription('Opret gear react embed');
  const setChannelCommand = new SlashCommandBuilder()
    .setName('setchannel')
    .setDescription('Opret panel eller sæt tid på område')
    .addStringOption((option) =>
      option
        .setName('område')
        .setDescription('Vælg område (fx B - VV)')
        .setRequired(false)
        .addChoices(
          ...COOLDOWN_ITEMS.map((item) => ({ name: item.label, value: item.id })),
        ),
    )
    .addStringOption((option) =>
      option
        .setName('tid')
        .setDescription('Sæt tid fx 20m, 1h, 1d, 20m 30s')
        .setRequired(false),
    );
  const commandPayload = [celleCommand.toJSON(), reactCommand.toJSON()];
  commandPayload.push(setChannelCommand.toJSON());

  const rest = new REST({ version: '10' }).setToken(TOKEN);
  await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commandPayload });
  console.log('Globale slash commands /celle og /react registreret');

  if (GUILD_ID) {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commandPayload,
    });
    console.log(`Guild slash commands registreret for GUILD_ID=${GUILD_ID}`);
  } else {
    console.warn('GUILD_ID mangler, registrerer kun globale commands.');
  }
}

loadTrackingState();

client.once('ready', async () => {
  console.log(`Logget ind som ${client.user.tag}`);
  try {
    await registerSlashCommand();
    const channelIds = new Set([
      ...Array.from(trackerMessageIdsByChannel.keys()),
      ...Array.from(trackedCells.values()).map((entry) => entry.channelId),
    ]);

    for (const channelId of channelIds) {
      try {
        const channel = await client.channels.fetch(channelId);
        if (channel?.isTextBased()) {
          await refreshTrackingEmbed(channel);
        }
      } catch (error) {
        console.error(`Kunne ikke gendanne tracking i kanal ${channelId}:`, error.message);
      }
    }
  } catch (error) {
    console.error('Kunne ikke registrere commands:', error);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isButton()) {
    if (!interaction.customId.startsWith('cooldown:')) return;
    const [, rawMessageId, itemId] = interaction.customId.split(':');
    const messageId = rawMessageId === 'pending' ? interaction.message.id : rawMessageId;
    const panel = cooldownPanels.get(messageId) || getCooldownPanelForChannel(interaction.channelId);
    const item = getCooldownItemById(itemId);

    if (!panel || !item) {
      await interaction.reply({ content: 'Cooldown panel kunne ikke findes. Kør `/setchannel` igen.', ephemeral: true });
      return;
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const current = panel.cooldowns[itemId];
    if (current.end > nowSec) {
      panel.cooldowns[itemId] = { ...current, end: 0, user: '' };
    } else {
      panel.cooldowns[itemId] = { ...current, end: nowSec + current.durationSec, user: interaction.user.username };
    }

    try {
      await interaction.update({
        embeds: [buildCooldownPanelEmbed(panel)],
        components: buildCooldownPanelRows(panel),
      });
    } catch (error) {
      console.error('Kunne ikke opdatere cooldown panel efter knaptryk:', error.message);
      clearCooldownPanel(panel);
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  if (!interaction.inGuild()) {
    await interaction.reply({ content: 'Denne command virker kun i en server.', ephemeral: true });
    return;
  }

  if (interaction.commandName === 'react') {
    const reactEmbed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setDescription('**Gear react B:**\nReact på emojis nedenunder, hvilket gear du har!');

    const sentMessage = await interaction.reply({ embeds: [reactEmbed], fetchReply: true });

    const reactionResults = await Promise.allSettled(REACT_EMOJI_IDS.map((emojiId) => sentMessage.react(emojiId)));
    reactionResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Kunne ikke tilføje react ${REACT_EMOJI_IDS[index]}:`, result.reason?.message || result.reason);
      }
    });
    return;
  }

  if (interaction.commandName === 'setchannel') {
    if (interaction.user.id !== SET_CHANNEL_ADMIN_ID) {
      await interaction.reply({ content: 'Du har ikke adgang til denne command.', ephemeral: true });
      return;
    }

    const areaId = interaction.options.getString('område');
    const timeInput = interaction.options.getString('tid');

    if ((areaId && !timeInput) || (!areaId && timeInput)) {
      await interaction.reply({
        content: 'Brug begge felter sammen: `/setchannel område:<...> tid:<...>`.',
        ephemeral: true,
      });
      return;
    }

    if (areaId && timeInput) {
      const panel = getCooldownPanelForChannel(interaction.channelId);
      if (!panel) {
        await interaction.reply({
          content: 'Der findes ikke et panel i denne kanal endnu. Kør `/setchannel` først.',
          ephemeral: true,
        });
        return;
      }

      const durationMs = parseDuration(timeInput);
      if (durationMs < 1000) {
        await interaction.reply({
          content: 'Ugyldig tid. Brug fx `20m`, `1h`, `1d`, `20m 30s`.',
          ephemeral: true,
        });
        return;
      }

      const durationSec = Math.floor(durationMs / 1000);
      const nowSec = Math.floor(Date.now() / 1000);
      panel.cooldowns[areaId] = {
        end: nowSec + durationSec,
        user: interaction.user.username,
        durationSec,
      };

      try {
        await renderCooldownPanel(panel);
      } catch (error) {
        console.error('Kunne ikke opdatere panel efter /setchannel område+tid:', error.message);
      }

      const item = getCooldownItemById(areaId);
      await interaction.reply({
        content: `Sat **${item?.label || areaId}** til **${formatMMSSFromSeconds(durationSec)}** og startet cooldown.`,
        ephemeral: true,
      });
      return;
    }

    const cooldowns = Object.fromEntries(
      COOLDOWN_ITEMS.map((item) => [item.id, { end: 0, user: '', durationSec: DEFAULT_COOLDOWN_SECONDS }]),
    );

    const initialEmbed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle('🕒 Cooldowns – B & B+')
      .setDescription('Live oversigt over aktive cooldowns.')
      .addFields({ name: 'Status', value: 'Der er ingen aktive cooldowns.' }, { name: '\u200B', value: '\u200B' });

    const setupRows = [new ActionRowBuilder(), new ActionRowBuilder()];
    for (const item of COOLDOWN_ITEMS) {
      setupRows[item.row].addComponents(
        new ButtonBuilder()
          .setCustomId(`cooldown:pending:${item.id}`)
          .setStyle(ButtonStyle.Success)
          .setLabel(`Start ${item.label}`),
      );
    }

    const sentMessage = await interaction.reply({
      embeds: [initialEmbed],
      components: setupRows,
      fetchReply: true,
    });

    const panel = {
      messageId: sentMessage.id,
      channelId: sentMessage.channelId,
      cooldowns,
      interval: null,
    };

    panel.interval = setInterval(async () => {
      const nowSec = Math.floor(Date.now() / 1000);
      let changed = false;

      for (const value of Object.values(panel.cooldowns)) {
        if (value.end > 0 && value.end <= nowSec) {
          value.end = nowSec + value.durationSec;
          changed = true;
        }
      }

      try {
        await renderCooldownPanel(panel);
      } catch (error) {
        console.error('Cooldown panel interval stoppet:', error.message);
        clearCooldownPanel(panel);
      }

      if (changed) {
        // no-op: panel er allerede rerenderet, men changed beholdes for læsbarhed/udvidelser.
      }
    }, 1000);

    cooldownPanels.set(panel.messageId, panel);
    try {
      await renderCooldownPanel(panel);
    } catch (error) {
      console.error('Kunne ikke starte cooldown panel:', error.message);
      clearCooldownPanel(panel);
    }
    return;
  }

  if (interaction.commandName !== 'celle') return;

  const memberRoles = interaction.member?.roles;
  const hasRole = Array.isArray(memberRoles)
    ? memberRoles.some((roleId) => interaction.guild.roles.cache.get(roleId)?.name === REQUIRED_ROLE_NAME)
    : memberRoles?.cache?.some((role) => role.name === REQUIRED_ROLE_NAME);

  if (!hasRole) {
    await interaction.reply({
      content: `Du skal have rollen **${REQUIRED_ROLE_NAME}** for at bruge /celle.`,
      ephemeral: true,
    });
    return;
  }

  const cellName = interaction.options.getString('celle', true);
  const timeInput = interaction.options.getString('tid', true);
  const note = interaction.options.getString('note') || 'Ingen noter';
  const imageAttachment = interaction.options.getAttachment('billede');
  const reminderRole = interaction.guild.roles.cache.find(
    (role) => role.name.toLowerCase() === REQUIRED_ROLE_NAME.toLowerCase(),
  );

  if (imageAttachment && !imageAttachment.contentType?.startsWith('image/')) {
    await interaction.reply({
      content: 'Vedhæftningen skal være et billede (png/jpg/webp/gif).',
      ephemeral: true,
    });
    return;
  }

  const durationMs = parseDuration(timeInput);
  if (durationMs < 1000) {
    await interaction.reply({
      content: 'Ugyldig tid. Brug fx `2h 22m`, `45m`, `1d2h30m` eller `90s`.',
      ephemeral: true,
    });
    return;
  }

  const endTimeMs = Date.now() + durationMs;
  const createdAtMs = Date.now();
  const imageUrl = imageAttachment?.url || null;

  const initialEmbed = buildCountdownEmbed({
    cellName,
    note,
    imageUrl,
    createdBy: interaction.user.username,
    endTimeMs,
    createdAtMs,
  });

  const message = await interaction.reply({
    embeds: [initialEmbed],
    fetchReply: true,
  });

  const key = `${message.channelId}:${message.id}`;
  trackedCells.set(key, {
    key,
    cellName,
    endTimeMs,
    channelId: message.channelId,
    messageId: message.id,
    messageUrl: message.url,
  });
  restrictedChannelIds.add(message.channelId);
  persistTrackingState();
  await refreshTrackingEmbed(message.channel);

  activeCountdowns.set(key, {
    tickInterval: null,
    deleteTimeout: null,
    reminderTimeouts: [],
    lastReminderMessage: null,
    lastRenderedSecond: null,
  });

  const scheduleReminder = (beforeMs, label) => {
    if (!reminderRole || durationMs <= beforeMs) return;
    const delay = durationMs - beforeMs;
    const reminderTimeout = setTimeout(async () => {
      try {
        const current = activeCountdowns.get(key);
        if (current?.lastReminderMessage) {
          try {
            await current.lastReminderMessage.delete();
          } catch (error) {
            console.error('Kunne ikke slette tidligere påmindelse:', error.message);
          }
        }

        const reminderMessage = await sendExpiryReminder({
          message,
          roleId: reminderRole.id,
          cellName,
          endTimeMs,
          label,
        });
        if (current && reminderMessage) current.lastReminderMessage = reminderMessage;
      } catch (error) {
        console.error(`Fejl ved ${label}-påmindelse:`, error.message);
      }
    }, delay);

    const state = activeCountdowns.get(key);
    if (state) state.reminderTimeouts.push(reminderTimeout);
  };

  scheduleReminder(60 * 60 * 1000, '1 time');
  scheduleReminder(15 * 60 * 1000, '15 min');
  scheduleReminder(5 * 60 * 1000, '5 min');
  scheduleReminder(60 * 1000, '1 min');

  const tick = async () => {
    const remainingMs = endTimeMs - Date.now();
    const remainingSecond = Math.max(0, Math.floor(remainingMs / 1000));
    const state = activeCountdowns.get(key);
    if (!state) return;

    try {
      if (remainingMs > 0) {
        if (state.lastRenderedSecond === remainingSecond) return;
        const activeEmbed = buildCountdownEmbed({
          cellName,
          note,
          imageUrl,
          createdBy: interaction.user.username,
          endTimeMs,
          createdAtMs,
        });
        const updated = await editCountdownMessage(message.channel, message.id, activeEmbed);
        if (updated) state.lastRenderedSecond = remainingSecond;
        return;
      }

      const deleteAtMs = Date.now() + DELETE_AFTER_EXPIRED_MS;
      const expiredEmbed = buildCountdownEmbed({
        cellName,
        note,
        imageUrl,
        createdBy: interaction.user.username,
        endTimeMs,
        createdAtMs,
        deleteAtMs,
        expired: true,
      });
      await editCountdownMessage(message.channel, message.id, expiredEmbed);

      trackedCells.delete(key);
      persistTrackingState();
      await refreshTrackingEmbed(message.channel);

      const current = activeCountdowns.get(key);
      if (current?.lastReminderMessage) {
        try {
          await current.lastReminderMessage.delete();
        } catch (error) {
          console.error('Kunne ikke slette påmindelsesbesked:', error.message);
        }
        current.lastReminderMessage = null;
      }

      const deleteTimeout = setTimeout(async () => {
        try {
          await message.delete();
        } catch (error) {
          console.error('Kunne ikke slette udløbet besked:', error.message);
        } finally {
          clearCountdownTimers(key);
        }
      }, DELETE_AFTER_EXPIRED_MS);

      const state = activeCountdowns.get(key);
      if (state) {
        state.deleteTimeout = deleteTimeout;
      }
    } catch (error) {
      console.error('Fejl ved nedtælling-opdatering:', error.message);
    }
  };
  const state = activeCountdowns.get(key);
  if (state) state.tickInterval = setInterval(tick, 1000);
  await tick();
});

client.on('messageDelete', async (message) => {
  const panel = cooldownPanels.get(message.id);
  if (panel) {
    clearCooldownPanel(panel);
  }

  const key = `${message.channelId}:${message.id}`;
  if (!trackedCells.has(key)) return;

  trackedCells.delete(key);
  persistTrackingState();
  clearCountdownTimers(key);

  try {
    if (message.channel?.isTextBased()) {
      await refreshTrackingEmbed(message.channel);
    } else if (message.channelId) {
      const channel = await client.channels.fetch(message.channelId);
      if (channel?.isTextBased()) {
        await refreshTrackingEmbed(channel);
      }
    }
  } catch (error) {
    console.error('Kunne ikke opdatere tracking efter manuel sletning:', error.message);
  }
});

client.on('messageCreate', async (message) => {
  if (message.author?.bot) return;
  if (!message.guildId) return;
  if (!restrictedChannelIds.has(message.channelId)) return;

  try {
    await message.delete();
    const notice = await message.channel.send({
      content: `${message.author}, denne kanal tillader kun **/celle** command.`,
    });
    setTimeout(async () => {
      try {
        await notice.delete();
      } catch {
        // ignorer
      }
    }, 8000);
  } catch (error) {
    console.error('Kunne ikke håndhæve /celle-only kanal:', error.message);
  }
});

process.on('SIGINT', () => {
  for (const key of activeCountdowns.keys()) clearCountdownTimers(key);
  for (const panel of cooldownPanels.values()) clearCooldownPanel(panel);
  process.exit(0);
});

process.on('SIGTERM', () => {
  for (const key of activeCountdowns.keys()) clearCountdownTimers(key);
  for (const panel of cooldownPanels.values()) clearCooldownPanel(panel);
  process.exit(0);
});

client.login(TOKEN).catch((error) => {
  console.error('Login fejl:', error);
  process.exit(1);
});
