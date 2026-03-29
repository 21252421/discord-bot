const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

const client = new Client({
intents: [GatewayIntentBits.Guilds]
});

// ===== TIME =====
function parseTime(str) {
let total = 0;
const matches = str.match(/\d+[hm]/g);
if (!matches) return 0;

for (const m of matches) {
if (m.endsWith("h")) total += parseInt(m) * 3600000;
if (m.endsWith("m")) total += parseInt(m) * 60000;
}

return total;
}

function formatTime(ms) {
let s = Math.floor(ms / 1000);
let h = Math.floor(s / 3600);
let m = Math.floor((s % 3600) / 60);
let sec = s % 60;
return `${h}h ${m}m ${sec}s`;
}

// ===== COMMAND =====
client.on("interactionCreate", async interaction => {
if (!interaction.isChatInputCommand()) return;
if (interaction.commandName !== "celle") return;

try {
await interaction.deferReply();

```
// 🔥 SAFE OPTIONS
const cell = interaction.options.getString("celle") || "ukendt";
const timeStr = interaction.options.getString("tid") || "1m";

const ms = parseTime(timeStr);
if (!ms) {
  return interaction.editReply("❌ Ugyldig tid");
}

const end = Date.now() + ms;

const embed = new EmbedBuilder()
  .setTitle("⏳ Celle")
  .setColor(0x00ff00)
  .addFields(
    { name: "Celle", value: cell },
    { name: "Tid tilbage", value: formatTime(ms) }
  )
  .setFooter({ text: "Bot virker stabilt" });

const message = await interaction.editReply({ embeds: [embed] });

const interval = setInterval(async () => {
  try {
    const remaining = end - Date.now();

    if (remaining <= 0) {
      clearInterval(interval);

      embed.setFields(
        { name: "Celle", value: cell },
        { name: "Tid tilbage", value: "❌ Færdig" }
      );

      await message.edit({ embeds: [embed] });
      return;
    }

    embed.setFields(
      { name: "Celle", value: cell },
      { name: "Tid tilbage", value: formatTime(remaining) }
    );

    await message.edit({ embeds: [embed] });

  } catch (err) {
    console.log("Interval fejl:", err);
    clearInterval(interval);
  }
}, 1000);
```

} catch (err) {
console.log("Command fejl:", err);

```
if (interaction.deferred) {
  interaction.editReply("❌ Fejl opstod");
}
```

}
});

// ===== READY =====
client.once("ready", () => {
console.log("🔥 Bot virker nu 100%");
});

client.login(process.env.TOKEN);
