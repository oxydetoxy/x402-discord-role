import axios, { AxiosError } from "axios";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  StringSelectMenuBuilder,
  TextChannel,
} from "discord.js";
import { withPaymentInterceptor } from "x402-axios";
import { createSigner } from "x402-fetch";

// Configuration
const DISCORD_TOKEN = process.env.DISCORD_TOKEN || "YOUR_BOT_TOKEN_HERE";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

// Types for backend responses
interface ChannelConfig {
  id: string;
  channelId: string;
  serverId: string;
  defaultChannelId: string;
  costInUsdc: string;
  roleId: string;
  roleApplicableTime: number;
  server?: {
    serverId: string;
    receiverSolanaAddress: string;
    receiverEthereumAddress: string;
  };
}

interface ServerConfig {
  id: string;
  serverId: string;
  defaultChannelId: string;
  receiverSolanaAddress: string;
  receiverEthereumAddress: string;
  channelCount: number;
  channels: Array<{
    id: string;
    channelId: string;
    costInUsdc: bigint;
    roleId: string;
    roleApplicableTime: number;
  }>;
}

interface NetworkUser {
  networkId: string;
  networkName: string;
  publicKey: string;
  balance: string;
  privateKey: string;
}

// Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

async function fetchUserInfo(discordId: string): Promise<{
  networkUsers: NetworkUser[];
} | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/user/${discordId}`, {
      headers: {
        Authorization: `Bearer ${process.env.BACKEND_API_KEY}`,
      },
    });
    if (!response.ok) {
      console.log(`User ${discordId} not found in backend`);
      return { networkUsers: [] };
    }
    const data = (await response.json()) as {
      success: boolean;
      networkUsers: NetworkUser[];
    };
    return data.success
      ? { networkUsers: data.networkUsers }
      : { networkUsers: [] };
  } catch (error) {
    console.error("Error fetching user info:", error);
    return { networkUsers: [] };
  }
}
// Helper function to fetch channel configuration from backend
async function fetchChannelConfig(
  channelId: string
): Promise<ChannelConfig | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/channel/${channelId}`, {
      headers: {
        Authorization: `Bearer ${process.env.BACKEND_API_KEY}`,
      },
    });

    if (!response.ok) {
      console.log(`Channel ${channelId} not configured in backend`);
      return null;
    }

    const data = (await response.json()) as {
      success: boolean;
      channel: ChannelConfig;
    };
    return data.success ? data.channel : null;
  } catch (error) {
    console.error("Error fetching channel config:", error);
    return null;
  }
}

// Helper function to fetch server configuration from backend
async function fetchServerConfig(
  serverId: string
): Promise<ServerConfig | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/server/${serverId}`, {
      headers: {
        Authorization: `Bearer ${process.env.BACKEND_API_KEY}`,
      },
    });

    if (!response.ok) {
      console.log(`Server ${serverId} not configured in backend`);
      return null;
    }

    const data = (await response.json()) as {
      success: boolean;
      server: ServerConfig;
    };
    return data.success ? data.server : null;
  } catch (error) {
    console.error("Error fetching server config:", error);
    return null;
  }
}

// Helper function to get role name from guild
async function getRoleName(
  guildId: string,
  roleId: string
): Promise<string | null> {
  try {
    const guild = await client.guilds.fetch(guildId);
    const role = await guild.roles.fetch(roleId);
    return role ? role.name : null;
  } catch (error) {
    console.error("Error fetching role:", error);
    return null;
  }
}

// Create interactive panel with buttons and dropdown showing ALL available roles
async function createInteractivePanel(
  channel: TextChannel,
  serverConfig: ServerConfig
) {
  // Delete all messages in the channel (Discord allows bulk delete for messages < 14 days old)
  try {
    let deleted;
    do {
      deleted = await channel.bulkDelete(100, true); // true = filter out messages > 14 days
    } while (deleted.size > 0);
  } catch (error) {
    console.error("Error deleting messages:", error);
  }
  if (serverConfig.channels.length === 0) {
    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("❌ No Channels Configured")
          .setDescription(
            "No channels have been configured with roles yet. Please contact an administrator."
          )
          .setColor(0xed4245),
      ],
    });
    return;
  }

  // Build dropdown options from all configured channels
  const roleOptions = [];
  let embedDescription = "**Available Roles:**\n\n";

  for (const channelConfig of serverConfig.channels) {
    const roleName = await getRoleName(channel.guildId!, channelConfig.roleId);

    if (!roleName) {
      console.log(`⚠️  Role ${channelConfig.roleId} not found, skipping`);
      continue;
    }

    const costInUsdc = Number(channelConfig.costInUsdc);
    const durationInDays = Math.floor(
      channelConfig.roleApplicableTime / (24 * 60 * 60)
    );

    // Add to dropdown options
    roleOptions.push({
      label: roleName,
      description: `${costInUsdc / 1000000} USDC for ${durationInDays} days`,
      value: `${channelConfig.channelId}_${channelConfig.roleId}`,
      emoji: "🎭",
    });

    // Add to embed description
    embedDescription += `🎭 **${roleName}**\n`;
    embedDescription += `   💰 Cost: ${costInUsdc / 1000000} USDC\n`;
    embedDescription += `   ⏱️ Duration: ${durationInDays} days\n\n`;
  }

  if (roleOptions.length === 0) {
    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("❌ No Valid Roles")
          .setDescription(
            "No valid roles found. Please check role configurations."
          )
          .setColor(0xed4245),
      ],
    });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle("💰 Role Shop")
    .setDescription(
      embedDescription +
        "\n*Select a role from the dropdown below to purchase!*"
    )
    .setColor(0x5865f2)
    .addFields(
      { name: "💵 Deposit", value: "Add funds to your account", inline: true },
      {
        name: "💸 Withdraw",
        value: "Withdraw funds from your account",
        inline: true,
      }
    )
    .setFooter({ text: "All interactions are private and visible only to you" })
    .setTimestamp();

  // Create buttons row
  const depositButton = new ButtonBuilder()
    .setCustomId("deposit")
    .setLabel("Deposit")
    .setEmoji("💵")
    .setStyle(ButtonStyle.Success);

  const withdrawButton = new ButtonBuilder()
    .setCustomId("withdraw")
    .setLabel("Withdraw")
    .setEmoji("💸")
    .setStyle(ButtonStyle.Danger);

  const getRoleButton = new ButtonBuilder()
    .setCustomId("get_role_none")
    .setLabel("Get Role")
    .setEmoji("🎭")
    .setStyle(ButtonStyle.Primary)
    .setDisabled(true); // Disabled by default until a role is selected

  const buttonsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    depositButton,
    withdrawButton,
    getRoleButton
  );

  // Create dropdown menu with ALL configured roles
  const roleSelect = new StringSelectMenuBuilder()
    .setCustomId(`role_select_${serverConfig.serverId}`)
    .setPlaceholder("🛒 Select a role to purchase")
    .addOptions(roleOptions);

  const selectRow =
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(roleSelect);

  // Send the message with components
  await channel.send({
    embeds: [embed],
    components: [buttonsRow, selectRow],
  });

  console.log(
    `📋 Panel created in channel ${channel.name} with ${roleOptions.length} role(s)`
  );
}

// Helper function to fetch all servers from backend
async function fetchAllServers(): Promise<ServerConfig[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/servers`, {
      headers: {
        Authorization: `Bearer ${process.env.BACKEND_API_KEY}`,
      },
    });

    if (!response.ok) {
      console.log("Failed to fetch servers from backend");
      return [];
    }

    const data = (await response.json()) as {
      success: boolean;
      servers: ServerConfig[];
    };
    return data.success ? data.servers : [];
  } catch (error) {
    console.error("Error fetching all servers:", error);
    return [];
  }
}

// Send panel to default channel for a server
async function sendPanelToDefaultChannel(server: ServerConfig) {
  try {
    // Find the guild (Discord server)
    const guild = client.guilds.cache.get(server.serverId);

    if (!guild) {
      console.log(`⚠️  Bot is not in server ${server.serverId}`);
      return;
    }

    // Get the default channel
    const channel = await guild.channels.fetch(server.defaultChannelId);

    if (!channel || !channel.isTextBased()) {
      console.log(
        `⚠️  Default channel ${server.defaultChannelId} not found or not a text channel`
      );
      return;
    }

    // Send the panel
    await createInteractivePanel(channel as TextChannel, server);
    console.log(`✅ Panel sent to default channel in ${guild.name}`);
  } catch (error) {
    console.error(
      `❌ Error sending panel to server ${server.serverId}:`,
      error
    );
  }
}

// Bot ready event
client.once("clientReady", async () => {
  console.log(`✅ Bot logged in as ${client.user?.tag}`);
  console.log(`Bot is ready to serve in ${client.guilds.cache.size} guilds`);

  // Fetch all configured servers from backend
  console.log("\n🔄 Fetching server configurations...");
  const servers = await fetchAllServers();

  if (servers.length === 0) {
    console.log("⚠️  No servers configured in backend");
    console.log("💡 Use the backend API to configure servers and channels");
    return;
  }

  console.log(`📋 Found ${servers.length} configured server(s)\n`);

  // Send panel to each server's default channel
  for (const server of servers) {
    await sendPanelToDefaultChannel(server);
    // Add a small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log("\n🎉 Bot is fully initialized and panels have been sent!");
});

// Handle bot joining a new server
client.on("guildCreate", async (guild) => {
  console.log(`\n🆕 Bot joined new server: ${guild.name} (${guild.id})`);

  // Fetch server configuration
  const serverConfig = await fetchServerConfig(guild.id);

  if (!serverConfig) {
    console.log(`⚠️  Server ${guild.id} not configured in backend`);
    console.log("💡 Configure this server using the backend API:");
    console.log(`   POST ${BACKEND_URL}/api/server`);
    console.log(
      `   Body: { "serverId": "${guild.id}", "defaultChannelId": "...", "receiverSolanaAddress": "...", "receiverEthereumAddress": "..." }`
    );
    return;
  }

  // Send panel to default channel
  console.log(`✅ Server is configured, sending panel to default channel...`);
  await sendPanelToDefaultChannel(serverConfig);
});

// Handle button and dropdown interactions
client.on("interactionCreate", async (interaction) => {
  //get server and user config before only
  const userId = interaction.user.id;
  const username = interaction.user.username;
  const guildId = interaction.guildId;

  const userInfo = await fetchUserInfo(userId);
  const serverConfig = await fetchServerConfig(guildId!);

  // Handle button clicks
  if (interaction.isButton()) {
    if (!serverConfig) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("❌ Server Not Configured")
            .setDescription(
              "This server is not configured for deposits. Please contact an administrator."
            )
            .setColor(0xed4245),
        ],
        ephemeral: true,
      });
      return;
    }

    if (!userInfo) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("❌ User Not Found")
            .setDescription("User not found in backend")
            .setColor(0xed4245),
        ],
        ephemeral: true,
      });
      return;
    }

    if (interaction.customId === "deposit") {
      const fields = [];
      for (const networkUser of userInfo.networkUsers) {
        fields.push({
          name: networkUser.networkName.toUpperCase() + " ADDRESS",
          value: `\`\`\`${networkUser.publicKey}\`\`\``,
          inline: false,
        });
        fields.push({
          name: networkUser.networkName.toUpperCase() + " BALANCE",
          value: `**${Number(networkUser.balance) / 1000000} USDC**`,
          inline: false,
        });
      }
      fields.push(
        {
          name: "📋 Instructions",
          value:
            "1. Send USDC to either address above (choose your preferred network)\n2. Wait for blockchain confirmation (1-5 minutes)\n3. Your balance will be updated automatically.",
        },
        {
          name: "⚠️ Important",
          value:
            "• Only send USDC tokens to these addresses\n• Make sure you're on the correct network.",
        }
      );
      // Create deposit embed
      const depositEmbed = new EmbedBuilder()
        .setTitle("💵 Deposit Funds")
        .setDescription(
          "Send USDC to one of the addresses below to add funds to your account."
        )
        .setColor(0x57f287)
        .addFields(fields)
        .setTimestamp();

      // Reply with ephemeral message (only visible to the user)
      await interaction.reply({
        embeds: [depositEmbed],
        ephemeral: true, // This makes the message visible only to the user
      });

      console.log(
        `💵 ${username} (${userId}) clicked Deposit button for server ${interaction.guildId}`
      );
    } else if (interaction.customId === "withdraw") {
      // Create withdraw embed
      const withdrawEmbed = new EmbedBuilder()
        .setTitle("💸 Withdraw Funds")
        .setDescription(
          "You have selected the withdraw option.\n\nCurrent Balance: **500 USDC**"
        )
        .setColor(0xed4245)
        .addFields(
          {
            name: "Available Balance",
            value: "500 USDC",
            inline: true,
          },
          {
            name: "Minimum Amount",
            value: "100 USDC",
            inline: true,
          },
          {
            name: "💳 Withdrawal Address",
            value:
              "Please provide your withdrawal address in the support channel",
          },
          {
            name: "⏱️ Processing Time",
            value: "Withdrawals are processed within 24-48 hours",
          },
          {
            name: "⚠️ Important",
            value:
              "Make sure to double-check your withdrawal address. Transactions cannot be reversed!",
          }
        )
        .setTimestamp();

      // Reply with ephemeral message
      await interaction.reply({
        embeds: [withdrawEmbed],
        ephemeral: true, // Only visible to the user
      });

      console.log(`💸 ${username} (${userId}) clicked Withdraw button`);
    } else if (interaction.customId.startsWith("get_role_")) {
      // Handle role purchase from the main Get Role button
      const roleData = interaction.customId.replace("get_role_", "");

      if (roleData === "none") {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ No Role Selected")
              .setDescription(
                "Please select a role from the dropdown menu first."
              )
              .setColor(0xed4245),
          ],
          ephemeral: true,
        });
        return;
      }

      const [channelId, roleId] = roleData.split("_");

      if (!roleId || !channelId) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Error")
              .setDescription("Invalid role data. Please select a role again.")
              .setColor(0xed4245),
          ],
          ephemeral: true,
        });
        return;
      }

      // Fetch channel config to get role details
      const channelConfig = await fetchChannelConfig(channelId);

      if (!interaction.guildId) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Error")
              .setDescription("Could not determine server.")
              .setColor(0xed4245),
          ],
          ephemeral: true,
        });
        return;
      }

      const roleName = await getRoleName(interaction.guildId, roleId);

      if (!channelConfig || !roleName) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Error")
              .setDescription("Could not process role assignment.")
              .setColor(0xed4245),
          ],
          ephemeral: true,
        });
        return;
      }

      const roleCost = Number(channelConfig.costInUsdc);
      const baseNetworkUser = userInfo.networkUsers.find(
        (user) => user.networkName === "base-sepolia"
      );

      const userBalance = baseNetworkUser?.balance;

      if (userBalance && Number(userBalance) < roleCost) {
        await interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Insufficient Balance")
              .setDescription(
                "You do not have enough balance to purchase this role. Your balance is " +
                  Number(userBalance) / 1000000 +
                  " USDC"
              )
              .setColor(0xed4245),
          ],
          ephemeral: true,
        });
        return;
      }

      // Defer the reply before making payment request (this gives us 15 minutes instead of 3 seconds)
      await interaction.deferReply({ ephemeral: true });

      const signer = await createSigner(
        "base-sepolia",
        baseNetworkUser?.privateKey ?? ""
      );
      try {
        const api = withPaymentInterceptor(
          axios.create({
            baseURL: BACKEND_URL,
          }),
          signer
        );
        const response = await api.get(
          `/api/access/network/${baseNetworkUser?.networkId}/server/${serverConfig.serverId}/channel/${channelId}/user/${userId}`,
          {
            headers: {
              AUTHORIZATION: `Bearer ${process.env.BACKEND_API_KEY}`,
            },
          }
        );
        if (!response.data.success) {
          await interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setTitle("❌ Error")
                .setDescription("Failed to get access to the role.")
                .setColor(0xed4245),
            ],
          });
          return;
        }
        await interaction.editReply({
          content: `Congratulations! You have successfully obtained the **${roleName}** role!`,
        });
        console.log(
          `🎭 ${username} (${userId}) confirmed ${roleName} role (${roleId}) in channel ${channelId}`
        );
        return;
      } catch (error) {
        console.error(
          error instanceof AxiosError
            ? (error as AxiosError).response?.data
            : "Unknown error"
        );
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Error")
              .setDescription("Failed to get access to the role.")
              .setColor(0xed4245),
          ],
        });
      }
      return;
    }
  }

  // Handle dropdown selection
  if (interaction.isStringSelectMenu()) {
    if (!serverConfig) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("❌ Server Not Configured")
            .setDescription(
              "This server is not configured for deposits. Please contact an administrator."
            )
            .setColor(0xed4245),
        ],
        ephemeral: true,
      });
      return;
    }

    if (!userInfo) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("❌ User Not Found")
            .setDescription("User not found in backend")
            .setColor(0xed4245),
        ],
        ephemeral: true,
      });
      return;
    }

    if (interaction.customId.startsWith("role_select_")) {
      // Defer the update IMMEDIATELY to avoid the 3-second timeout
      await interaction.deferUpdate();

      const selectedValue = interaction.values[0];

      if (!selectedValue) {
        await interaction.followUp({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Error")
              .setDescription("No role selected.")
              .setColor(0xed4245),
          ],
          ephemeral: true,
        });
        return;
      }

      // Parse the selected value: "channelId_roleId"
      const [channelId, selectedRoleId] = selectedValue.split("_");

      if (!channelId || !selectedRoleId) {
        await interaction.followUp({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Error")
              .setDescription("Invalid role selection.")
              .setColor(0xed4245),
          ],
          ephemeral: true,
        });
        return;
      }

      // Fetch channel configuration from backend
      const channelConfig = await fetchChannelConfig(channelId);

      if (!channelConfig) {
        await interaction.followUp({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Error")
              .setDescription("Channel configuration not found.")
              .setColor(0xed4245),
          ],
          ephemeral: true,
        });
        return;
      }

      const guildId = interaction.guildId;

      if (!guildId) {
        await interaction.followUp({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Error")
              .setDescription("Could not determine server.")
              .setColor(0xed4245),
          ],
          ephemeral: true,
        });
        return;
      }

      // Get role information from Discord
      const roleName = await getRoleName(guildId, selectedRoleId);

      if (!roleName) {
        await interaction.followUp({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Error")
              .setDescription("Role not found in this server.")
              .setColor(0xed4245),
          ],
          ephemeral: true,
        });
        return;
      }

      // Rebuild the buttons row with the Get Role button enabled
      const depositButton = new ButtonBuilder()
        .setCustomId("deposit")
        .setLabel("Deposit")
        .setEmoji("💵")
        .setStyle(ButtonStyle.Success);

      const withdrawButton = new ButtonBuilder()
        .setCustomId("withdraw")
        .setLabel("Withdraw")
        .setEmoji("💸")
        .setStyle(ButtonStyle.Danger);

      const getRoleButton = new ButtonBuilder()
        .setCustomId(`get_role_${channelId}_${selectedRoleId}`)
        .setLabel(`Get ${roleName}`)
        .setEmoji("🎭")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(false); // Now enabled with selected role

      const buttonsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        depositButton,
        withdrawButton,
        getRoleButton
      );

      // Rebuild the dropdown with all roles from server config
      const roleOptions = [];
      for (const channel of serverConfig!.channels) {
        const rName = await getRoleName(guildId, channel.roleId);
        if (!rName) continue;

        const costInUsdc = Number(channel.costInUsdc);
        const durationInDays = Math.floor(
          channel.roleApplicableTime / (24 * 60 * 60)
        );

        roleOptions.push({
          label: rName,
          description: `${
            costInUsdc / 1000000
          } USDC for ${durationInDays} days`,
          value: `${channel.channelId}_${channel.roleId}`,
          emoji: "🎭",
        });
      }

      const roleSelect = new StringSelectMenuBuilder()
        .setCustomId(`role_select_${serverConfig!.serverId}`)
        .setPlaceholder(`🛒 Selected: ${roleName}`)
        .addOptions(roleOptions);

      const selectRow =
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          roleSelect
        );

      // Update the message components to enable the Get Role button
      await interaction.editReply({
        components: [buttonsRow, selectRow],
      });

      console.log(
        `🎭 ${username} (${userId}) selected ${roleName} role from dropdown in channel ${channelId}`
      );
    }
  }
});

// Command to send the interactive panel
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.author.id !== message.guild?.ownerId) return;

  if (message.content === "!panel") {
    // Command to send the interactive panel (can be restricted to admins)
    const channel = message.channel as TextChannel;

    if (!message.guildId) {
      await message.reply("This command can only be used in a server!");
      return;
    }

    const serverConfig = await fetchServerConfig(message.guildId);
    if (!serverConfig) {
      await message.reply(
        "This server is not configured for role management. Please contact an administrator."
      );
      return;
    }

    await createInteractivePanel(channel, serverConfig);

    // Optionally delete the command message
    try {
      await message.delete();
    } catch (error) {
      console.log("Could not delete message (missing permissions)");
    }
  }
});

// Error handling
client.on("error", (error) => {
  console.error("Discord client error:", error);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});

// Login to Discord
client.login(DISCORD_TOKEN);
