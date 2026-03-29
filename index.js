const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");

const app = express();
app.get("/", (req, res) => res.send("Alive"));
app.listen(process.env.PORT || 3000);

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once("clientReady", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "celle") {
    const celle = interaction.options.getString("celle");
    const tid = interaction.options.getString("tid");

    await interaction.reply("🚓 " + celle + " er sat i celle i " + tid);
  }
});

client.login(process.env.TOKEN);
