const { Client } = require("discord.js");

const client = new Client({ intents: [] });

client.once("ready", () => {
  console.log("BOT ONLINE");
});

client.login(process.env.TOKEN);
