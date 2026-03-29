const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require("discord.js");
const express = require("express");

// ===== WEB SERVER (Railway kræver dette) =====
const app = express();
app.get("/", (req, res) => {
res.send("Bot is alive!");
});
app.listen(process.env.PORT || 3000, () => {
console.log("Webserver kører");
});

// ===== DISCORD BOT =====
const client = new Client({
intents: [GatewayIntentBits.Guilds]
});

// ===== SLASH COMMAND SETUP =====
const commands = [
new SlashCommandBuilder()
.setName("celle")
.setDescription("Test command")
.addStringOption(option =>
option.setName("celle")
.setDescription("celle navn")
.setRequired(true))
.addStringOption(option =>
option.setName("tid")
.setDescription("tid fx 1h")
.setRequired(true))
].map(command => command.toJSON());

// ===== REGISTER COMMANDS =====
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

client.once("clientReady", async () => {
console.log(`Logged in as ${client.user.tag}`);

try {
await rest.put(
Routes.applicationCommands(client.user.id),
{ body: commands }
);
console.log("Commands registered");
} catch (error) {
console.error(error);
}
});

// ===== COMMAND HANDLER =====
client.on("interactionCreate", async interaction => {
if (!interaction.isChatInputCommand()) return;

if (interaction.commandName === "celle") {

```
const celle = interaction.options.getString("celle");
const tid = interaction.options.getString("tid");

// svar hurtigt (fixer din fejl!)
await interaction.reply(`🚓 ${celle} er sat i celle i ${tid}`);
```

}
});

// ===== LOGIN =====
client.login(process.env.TOKEN);
