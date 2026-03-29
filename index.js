const { REST, Routes, SlashCommandBuilder } = require("discord.js");

// 🔴 UDFYLD DISSE
const TOKEN = process.env.TOKEN;
const CLIENT_ID = "1487783573736919040";
const GUILD_ID = "884411109426200606";

const commands = [
new SlashCommandBuilder()
.setName("celle")
.setDescription("Start en celle nedtælling")
.addStringOption(option =>
option.setName("celle")
.setDescription("Celle navn (fx b20)")
.setRequired(true)
)
.addStringOption(option =>
option.setName("tid")
.setDescription("Tid (fx 1h, 30m)")
.setRequired(true)
)
].map(command => command.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
try {
console.log("🔄 Opdaterer commands...");

```
await rest.put(
  Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
  { body: commands }
);

console.log("✅ Commands opdateret!");
```

} catch (error) {
console.error(error);
}
})();
