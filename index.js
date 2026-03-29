const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");

const client = new Client({
intents: [GatewayIntentBits.Guilds]
});

client.on("interactionCreate", async interaction => {
if (!interaction.isChatInputCommand()) return;

if (interaction.commandName === "celle") {

```
await interaction.reply("⏳ Starter...");

let celle = "ukendt";
let tid = "1m";

try {
  celle = interaction.options.getString("celle") || "ukendt";
  tid = interaction.options.getString("tid") || "1m";
} catch (e) {
  console.log("Options virker ikke endnu");
}

const embed = new EmbedBuilder()
  .setTitle("⏳ Celle")
  .setColor(0x00ff00)
  .addFields(
    { name: "Celle", value: celle },
    { name: "Tid", value: tid }
  );

await interaction.editReply({ embeds: [embed] });
```

}
});

client.once("clientReady", () => {
console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.TOKEN);
