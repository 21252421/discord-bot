const {
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
} = require('discord.js');
const express = require('express');

const TOKEN = process.env.TOKEN || process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const PORT = Number(process.env.PORT || 3000);
const REQUIRED_ROLE_NAME = 'Celler+';

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error('Mangler miljøvariabler: TOKEN/DISCORD_TOKEN, CLIENT_ID eller GUILD_ID');
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
  intents: [GatewayIntentBits.Guilds],
});

const activeCountdowns = new Map();

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
  const firstLetter = cellName.trim().charAt(0).toUpperCase();
  if (!firstLetter.match(/[A-ZÆØÅ]/i)) return 'Ukendt placering';
  return `${firstLetter} Celle`;
}

function buildCountdownEmbed({ cellName, note, imageUrl, createdBy, endTimeMs, expired = false }) {
  const relativeEnd = `<t:${Math.floor(endTimeMs / 1000)}:R>`;
  const absoluteEnd = `<t:${Math.floor(endTimeMs / 1000)}:f>`;

  const embed = new EmbedBuilder()
    .setTitle('⏳ Celle Nedtælling')
    .setColor(expired ? 0xff0000 : 0x00ff66)
    .addFields(
      { name: 'Celle', value: cellName, inline: true },
      { name: 'Placering', value: derivePlacement(cellName), inline: true },
      {
        name: 'Tid tilbage',
        value: expired ? `❌ Udløbet (${absoluteEnd})` : `${relativeEnd}\nUdløber ${absoluteEnd}`,
        inline: false,
      },
      { name: 'Noter', value: note || 'Ingen noter', inline: false },
    )
    .setFooter({ text: `Oprettet af: ${createdBy}` })
    .setTimestamp();

  if (imageUrl) {
    embed.setImage(imageUrl);
  }

  return embed;
}

async function registerSlashCommand() {
  const command = new SlashCommandBuilder()
    .setName('celle')
    .setDescription('Opret en celle-nedtælling')
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

  const rest = new REST({ version: '10' }).setToken(TOKEN);
  await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
    body: [command.toJSON()],
  });
  console.log('Slash command /celle registreret');
}

client.once('ready', async () => {
  console.log(`Logget ind som ${client.user.tag}`);
  try {
    await registerSlashCommand();
  } catch (error) {
    console.error('Kunne ikke registrere commands:', error);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== 'celle') return;

  if (!interaction.inGuild()) {
    await interaction.reply({ content: 'Denne command virker kun i en server.', ephemeral: true });
    return;
  }

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
  const imageUrl = imageAttachment?.url || null;

  const initialEmbed = buildCountdownEmbed({
    cellName,
    note,
    imageUrl,
    createdBy: interaction.user.username,
    endTimeMs,
  });

  const message = await interaction.reply({
    embeds: [initialEmbed],
    fetchReply: true,
  });

  const key = `${message.channelId}:${message.id}`;
  const timeout = setTimeout(async () => {
    try {
      const expiredEmbed = buildCountdownEmbed({
        cellName,
        note,
        imageUrl,
        createdBy: interaction.user.username,
        endTimeMs,
        expired: true,
      });
      await message.edit({ embeds: [expiredEmbed] });
    } catch (error) {
      console.error('Fejl ved udløb-opdatering:', error.message);
    } finally {
      activeCountdowns.delete(key);
    }
  }, durationMs);

  activeCountdowns.set(key, timeout);
});

process.on('SIGINT', () => {
  for (const timeout of activeCountdowns.values()) clearTimeout(timeout);
  process.exit(0);
});

process.on('SIGTERM', () => {
  for (const timeout of activeCountdowns.values()) clearTimeout(timeout);
  process.exit(0);
});

client.login(TOKEN).catch((error) => {
  console.error('Login fejl:', error);
  process.exit(1);
});
