const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

const client = new Client({
intents: [GatewayIntentBits.Guilds]
});

// 🔥 FANGER ALLE ERRORS (MEGA VIGTIG)
client.on("error", console.error);
process.on("unhandledRejection", console.error);
process.on("uncaughtException", console.error);

client.on("interactionCreate", async interaction => {
if (!interaction.isChatInputCommand()) return;

if (interaction.commandName === "celle") {
try {
// 🔥 SVAR MED DET SAMME
await interaction.reply("✅ Starter...");

```
  // ❌ ingen options endnu (de crasher stadig)
  const embed = new EmbedBuilder()
    .setTitle("⏳ Celle")
    .setColor(0x00ff00)
    .setDescription("Bot virker nu uden crash");

  await interaction.editReply({ embeds: [embed] });

} catch (err) {
  console.error("COMMAND ERROR:", err);

  if (!interaction.replied) {
    await interaction.reply("❌ Der skete en fejl");
  }
}
```

}
});

client.once("clientReady", () => {
console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.TOKEN);
