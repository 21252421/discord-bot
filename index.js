const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const TOKEN = "MTQ4Nzc4MzU3MzczNjkxOTA0MA.Gr4Otz.noyWM6njON8YDp8VRUaPjd88D2S5GeMqJtB1So";
const CLIENT_ID = "1487783573736919040";
const GUILD_ID = "1328497670565924914";
const ROLE_NAME = "Celler+";

// 🔹 SLASH COMMAND
const commands = [
  new SlashCommandBuilder()
    .setName('celle')
    .setDescription('Start en celle nedtælling')
    .addStringOption(option =>
      option.setName('celle')
        .setDescription('Celle nummer (fx a1, b20, apre5)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('tid')
        .setDescription('Tid (fx 1d 2h 30m)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('note')
        .setDescription('Valgfri note')
        .setRequired(false)
    )
    .addAttachmentOption(option =>
      option.setName('billede')
        .setDescription('Upload billede')
        .setRequired(false)
    )
];

const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("I'm alive!");
});

app.listen(3000, () => {
  console.log("Webserver kører");
});
// 🔹 REGISTER COMMAND
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log("✅ Slash command registreret");
  } catch (error) {
    console.error(error);
  }
})();

// 🔹 TIME PARSER
function parseTime(str) {
  let total = 0;
  const matches = str.match(/\d+[dhms]/g);
  if (!matches) return 0;

  matches.forEach(arg => {
    if (arg.endsWith("d")) total += parseInt(arg) * 86400000;
    if (arg.endsWith("h")) total += parseInt(arg) * 3600000;
    if (arg.endsWith("m")) total += parseInt(arg) * 60000;
    if (arg.endsWith("s")) total += parseInt(arg) * 1000;
  });

  return total;
}

// 🔹 FORMAT TIME
function formatTime(ms) {
  let s = Math.floor(ms / 1000);
  let d = Math.floor(s / 86400);
  let h = Math.floor((s % 86400) / 3600);
  let m = Math.floor((s % 3600) / 60);
  let sec = s % 60;
  return `${d}d ${h}h ${m}m ${sec}s`;
}

// 🔹 FARVER
function getColor(cell) {
  const c = cell.toLowerCase();
  if (c.includes("b") || c.includes("bpre") || c.includes("fcb")) return 0x00bfff;
  if (c.includes("a") || c.includes("apre") || c.includes("tpre") || c.includes("fca")) return 0x32cd32;
  if (c.includes("c") || c.includes("cpre")) return 0xff0000;
  return 0x5865f2;
}

// 🔹 PLACERING
function getPlacering(cell) {
  const c = cell.toLowerCase();
  if (c.startsWith("a")) return "A Celle";
  if (c.startsWith("b")) return "B Celle";
  if (c.startsWith("c")) return "C Celle";
  return "Ukendt";
}

// 🔹 COMMAND HANDLER
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'celle') {

    await interaction.deferReply();

    const role = interaction.guild.roles.cache.find(r => r.name === ROLE_NAME);
    if (!role || !interaction.member.roles.cache.has(role.id)) {
      return interaction.editReply({ content: "❌ Ingen adgang" });
    }

    const cell = interaction.options.getString('celle');
    const timeStr = interaction.options.getString('tid');
    const note = interaction.options.getString('note') || "Ingen noter";
    const image = interaction.options.getAttachment('billede');

    const timeMs = parseTime(timeStr);
    if (!timeMs) {
      return interaction.editReply({ content: "Ugyldig tid" });
    }

    const endTime = Date.now() + timeMs;
    const pingTime = endTime - 3600000;

    let embed = new EmbedBuilder()
      .setTitle("⏳ Celle Nedtælling")
      .setColor(getColor(cell))
      .addFields(
        { name: "Celle", value: cell, inline: true },
        { name: "Placering", value: getPlacering(cell), inline: true },
        { name: "Tid tilbage", value: formatTime(timeMs) },
        { name: "Noter", value: note }
      )
      .setFooter({ text: `Oprettet af: ${interaction.user.username}` });

    if (image) embed.setImage(image.url);

    await interaction.editReply({ embeds: [embed] });
    const msg = await interaction.fetchReply();

    let pinged = false;

    const interval = setInterval(async () => {
      const remaining = endTime - Date.now();

      if (!pinged && Date.now() >= pingTime) {
        pinged = true;
        interaction.channel.send(`<@&${role.id}> ⏰ 1 time tilbage for celle ${cell}`);
      }

      if (remaining <= 0) {
        clearInterval(interval);

        embed.setFields(
          { name: "Celle", value: cell, inline: true },
          { name: "Placering", value: getPlacering(cell), inline: true },
          { name: "Tid tilbage", value: "❌ Udløbet" },
          { name: "Noter", value: note }
        );

        await msg.edit({ embeds: [embed] });

        setTimeout(() => msg.delete().catch(() => {}), 86400000);
        return;
      }

      embed.setFields(
        { name: "Celle", value: cell, inline: true },
        { name: "Placering", value: getPlacering(cell), inline: true },
        { name: "Tid tilbage", value: formatTime(remaining) },
        { name: "Noter", value: note }
      );

      msg.edit({ embeds: [embed] });

    }, 1000);
  }
});

client.once('ready', () => {
  console.log("✅ Slash bot online!");
});

client.login(TOKEN);