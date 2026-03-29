const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
intents: [GatewayIntentBits.Guilds]
});

client.on("interactionCreate", async interaction => {
if (!interaction.isChatInputCommand()) return;

if (interaction.commandName === "celle") {
await interaction.reply("✅ BOT VIRKER");
}
});

client.once("clientReady", () => {
console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.TOKEN);
