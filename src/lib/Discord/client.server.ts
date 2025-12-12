import { building } from "$app/environment";
import { env } from "$env/dynamic/private";
import { Client, Collection, GatewayIntentBits, Partials } from "discord.js";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildInvites,
    ],
    partials: [
        Partials.Message,
        Partials.Channel, 
        Partials.Reaction,
        Partials.GuildMember
    ],
});

if(!building) await client.login(env.TOKEN);

const shutdown = () => {
    console.log('Destroying Discord client...');
    client.destroy();
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default client;