const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

const client = new Client({
intents: [GatewayIntentBits.Guilds]
});

function getColor(celle) {
if (!celle) return 0xffffff;
const c = celle.toUpperCase();
if (c.startsWith("A")) return 0x00ff00;
if (c.startsWith("B")) return 0x00ffff;
if (c.startsWith("C")) return 0xff0000;
return 0xffffff;
}

function formatTime(ms) {
const total = Math.max(0, Math.floor(ms / 1000));
const h = Math.floor(total / 3600);
const m = Math.floor((total % 3600) / 60);
const s = total % 60;
return `${h}h ${m}m ${s}s`;
}

client.on("interactionCreate", async interaction => {
if (!interaction.isChatInputCommand()) return;
if (interaction.commandName !== "celle") return;

try {
const celle = interaction.options.getString("celle") || "Ukendt";
const tid = interaction.options.getString("tid") || "0m";

```
// 👉 PARSE TID (SIKKER VERSION)
let duration = 0;

const hours = tid.match(/(\d+)h/);
const minutes = tid.match(/(\d+)m/);

if (hours) duration += parseInt(hours[1]) * 3600000;
if (minutes) duration += parseInt(minutes[1]) * 60000;

if (duration <= 0) {
  return interaction.reply("❌ Ugyldig tid! Brug fx 1h eller 30m");
}

const endTime = Date.now() + duration;

// 👉 SVAR MED DET SAMME (ingen deferReply!)
await interaction.reply("⏳ Starter countdown...");

const interval = setInterval(async () => {
  try {
    const remaining = endTime - Date.now();

    if (remaining <= 0) {
      clearInterval(interval);
      return interaction.editReply("⛓️ Personen er løsladt!");
    }

    const embed = new EmbedBuilder()
      .setTitle("⏳ Celle Nedtælling")
      .setColor(getColor(celle))
      .addFields(
        { name: "Celle", value: celle, inline: true },
        { name: "Tid tilbage", value: formatTime(remaining), inline: false }
      )
      .setFooter({ text: "Oprettet af: " + interaction.user.username })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

  } catch (err) {
    console.error("Interval fejl:", err);
    clearInterval(interval);
  }
}, 1000);
```

} catch (err) {
console.error("Command fejl:", err);
if (!interaction.replied) {
interaction.reply("❌ Der skete en fejl");
}
}
});

client.once("clientReady", () => {
console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.TOKEN);
