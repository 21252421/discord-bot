const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

const client = new Client({
intents: [GatewayIntentBits.Guilds]
});

client.on("interactionCreate", async interaction => {
if (!interaction.isChatInputCommand()) return;

if (interaction.commandName === "celle") {

```
// 🔥 SVAR MED DET SAMME (før alt andet)
await interaction.reply("✅ BOT VIRKER NU");

// ❌ INGEN options endnu (det er det der crasher)
const embed = new EmbedBuilder()
  .setTitle("TEST")
  .setColor(0x00ff00)
  .setDescription("Vi bygger videre herfra");

await interaction.editReply({ embeds: [embed] });
```

}
});

client.once("clientReady", () => {
console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.TOKEN);
