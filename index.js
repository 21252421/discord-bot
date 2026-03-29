const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');
const express = require("express");

// ===== ENV =====
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const ROLE_NAME = "Celler+";

// ===== EXPRESS =====
const app = express();
app.get("/", (req, res) => res.send("Alive"));
app.listen(process.env.PORT || 3000, () => {
console.log("Webserver kører");
});

// ===== CLIENT =====
const client = new Client({
intents: [GatewayIntentBits.Guilds]
});

// ===== ERROR HANDLING =====
client.on("error", console.error);
process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

// ===== COMMAND =====
const commands = [
new SlashCommandBuilder()
.setName('celle')
.setDescription('Start en celle nedtælling')
.addStringOption(option =>
option.setName('celle')
.setDescription('Celle nummer')
.setRequired(true)
)
.addStringOption(option =>
option.setName('tid')
.setDescription('Tid (fx 1h 30m)')
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
].map(cmd => cmd.toJSON());

// ===== REGISTER =====
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
try {
console.log("🔄 Registrerer commands...");
await rest.put(
Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
{ body: commands }
);
console.log("✅ Commands registreret");
} catch (error) {
console.error(error);
}
})();

// ===== TIME =====
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

function formatTime(ms) {
let s = Math.floor(ms / 1000);
let d = Math.floor(s / 86400);
let h = Math.floor((s % 86400) / 3600);
let m = Math.floor((s % 3600) / 60);
let sec = s % 60;
return `${d}d ${h}h ${m}m ${sec}s`;
}

// ===== COLOR =====
function getColor(cell) {
const c = cell.toLowerCase();
if (c.startsWith("b")) return 0x00bfff;
if (c.startsWith("a")) return 0x32cd32;
if (c.startsWith("c")) return 0xff0000;
return 0x5865f2;
}

// ===== PLACERING =====
function getPlacering(cell) {
const c = cell.toLowerCase();
if (c.startsWith("a")) return "A Celle";
if (c.startsWith("b")) return "B Celle";
if (c.startsWith("c")) return "C Celle";
return "Ukendt";
}

// ===== COMMAND HANDLER =====
client.on('interactionCreate', async interaction => {
if (!interaction.isChatInputCommand()) return;

if (interaction.commandName === 'celle') {
try {
await interaction.deferReply();

```
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
    return interaction.editReply({ content: "❌ Ugyldig tid" });
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
    // ✅ FIXED FOOTER (INGEN BACKTICKS)
    .setFooter({ text: "Oprettet af: " + interaction.user.username });

  if (image) embed.setImage(image.url);

  await interaction.editReply({ embeds: [embed] });
  const msg = await interaction.fetchReply();

  let pinged = false;

  const interval = setInterval(async () => {
    try {
      const remaining = endTime - Date.now();

      if (!pinged && Date.now() >= pingTime) {
        pinged = true;
        interaction.channel.send(`<@&${role.id}> ⏰ 1 time tilbage for ${cell}`);
      }

      if (!pinged && Date.now() >= pingTime) {
        pinged = true;
      
        try {
          await interaction.channel.send(
            `<@&${role.id}> ⏰ 1 time tilbage for ${cell}`
          );
        } catch (err) {
          console.error("Ping fejl:", err);
        }
      }

      embed.setFields(
        { name: "Celle", value: cell, inline: true },
        { name: "Placering", value: getPlacering(cell), inline: true },
        { name: "Tid tilbage", value: formatTime(remaining) },
        { name: "Noter", value: note }
      );

      await msg.edit({ embeds: [embed] });

    } catch (err) {
      console.error("Interval fejl:", err);
      clearInterval(interval);
    }
  }, 1000);

} catch (err) {
  console.error("Command fejl:", err);
  interaction.editReply("❌ Fejl opstod");
}
```

}
});

// ===== READY =====
client.once('ready', () => {
console.log("✅ Bot online!");
});

// ===== LOGIN =====
client.login(TOKEN);
