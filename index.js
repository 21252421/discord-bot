const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");

// ===== WEB SERVER (KRÆVET TIL RAILWAY) =====
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

// Når botten starter
client.once("clientReady", () => {
console.log(`Logged in as ${client.user.tag}`);
});

// Eksempel command (valgfri)
client.on("interactionCreate", async interaction => {
if (!interaction.isChatInputCommand()) return;

if (interaction.commandName === "ping") {
await interaction.reply("Pong!");
}
});

// ===== LOGIN (VIGTIGT) =====
client.login(process.env.TOKEN);
