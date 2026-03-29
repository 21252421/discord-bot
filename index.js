const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

const client = new Client({
intents: [GatewayIntentBits.Guilds]
});

client.on("interactionCreate", async interaction => {
if (!interaction.isChatInputCommand()) return;

if (interaction.commandName === "celle") {

```
// 🔥 SVAR MED DET SAMME (VIGTIGT)
await interaction.reply("✅ Command modtaget");

try {
  const celle = interaction.options.getString("celle");
  const tid = interaction.options.getString("tid");

  console.log("CELLE:", celle);
  console.log("TID:", tid);

  const embed = new EmbedBuilder()
    .setTitle("TEST")
    .setColor(0x00ff00)
    .addFields(
      { name: "Celle", value: celle || "IKKE FUNDET" },
      { name: "Tid", value: tid || "IKKE FUNDET" }
    );

  await interaction.editReply({ embeds: [embed] });

} catch (err) {
  console.error("FEJL:", err);
  await interaction.editReply("❌ FEJL - tjek logs");
}
```

}
});

client.once("clientReady", () => {
console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.TOKEN);
