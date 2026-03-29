const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

const client = new Client({
intents: [GatewayIntentBits.Guilds]
});

client.on("interactionCreate", async interaction => {
if (!interaction.isChatInputCommand()) return;

if (interaction.commandName === "celle") {
try {
// 🔥 HENT INPUT (safe)
const celle = interaction.options.getString("celle") || "ukendt";
const tid = interaction.options.getString("tid") || "1m";

```
  await interaction.reply("⏳ Starter...");

  const embed = new EmbedBuilder()
    .setTitle("⏳ Celle")
    .setColor(0x00ff00)
    .addFields(
      { name: "Celle", value: celle },
      { name: "Tid", value: tid }
    )
    .setFooter({ text: "Virker!" });

  await interaction.editReply({ embeds: [embed] });

} catch (err) {
  console.error(err);
  await interaction.reply("❌ fejl");
}
```

}
});

client.once("clientReady", () => {
console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.TOKEN);
