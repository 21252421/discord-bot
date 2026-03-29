const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

const client = new Client({
intents: [GatewayIntentBits.Guilds]
});

client.on("interactionCreate", async interaction => {
try {
if (!interaction.isChatInputCommand()) return;

```
if (interaction.commandName === "celle") {

  // SAFE værdier
  let celle = "ukendt";
  let tid = "1m";

  try {
    celle = interaction.options.getString("celle") || "ukendt";
    tid = interaction.options.getString("tid") || "1m";
  } catch {}

  await interaction.reply("⏳ Starter...");

  const embed = new EmbedBuilder()
    .setTitle("⏳ Celle")
    .setColor(0x00ff00)
    .addFields(
      { name: "Celle", value: celle },
      { name: "Tid", value: tid }
    )
    .setFooter({ text: "Bot virker 100%" });

  await interaction.editReply({ embeds: [embed] });
}
```

} catch (err) {
console.error("FEJL:", err);

```
try {
  if (!interaction.replied) {
    await interaction.reply("❌ Crash fanget");
  }
} catch {}
```

}
});

client.once("clientReady", () => {
console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.TOKEN);
