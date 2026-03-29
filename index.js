client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "celle") {
    await interaction.reply("✅ virker uden options");
  }
});
