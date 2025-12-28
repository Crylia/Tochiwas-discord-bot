const { Client, GatewayIntentBits, Partials, Routes, PermissionFlagsBits, PermissionsBitField, ChannelFlags, ChannelManager, ChannelFlagsBitField, ChannelType, Colors } = require('discord.js')
require('dotenv').config()
const { REST } = require('@discordjs/rest')
const { SlashCommandBuilder } = require('@discordjs/builders')
const {
  initReactionPerRole,
  messageReactionAdd,
  messageReactionRemove,
} = require('../features/reactionPerRole')

const {
  handleBlacklistAdd,
  handleBlacklistCheck,
  handleBlacklistShow,
  updateGlobalMessage,
} = require('../features/blacklist')

const {
  handleBirthdayAdd,
  handleBirthdayUpdate,
  handleBirthdayCheck,
  handleBirthdayDelete,
} = require('../features/birthday')

const {
  handleStaticAdd,
  handleStaticGet,
  handleStaticDelete,
  handleStaticUpdateUser,
  handleStaticUpdateSize,
} = require('../features/static')

const {
  CreateEventSchedule,
  DeleteEventSchedule,
  ReadEvents
} = require('../database/eventdb')
const { startEventCheckCron, refreshEventCache } = require('../tasks/eventReminder')

const { startBirthdayCheckCron } = require('../tasks/checkBirthday')

const { showRoleMembers } = require("../features/showRoleMembers")

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN)

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,

  ],
  partials: [
    Partials.Channel,
  ],
})

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return

  switch (interaction.commandName) {
    case 'blacklist': {
      const reportedUser = interaction.options.getString('player')
      const reason = interaction.options.getString('reason')
      const reportedByUser = interaction.user.username

      const res = await handleBlacklistAdd(reportedUser, reason, reportedByUser)
      if (res) {
        if (res.name === reportedUser)
          interaction.reply({ content: 'This user has already been reported', ephemeral: true })
        else {
          interaction.reply({ content: `Player ** ${reportedUser}** had been successfully reported for ${reason}`, ephemeral: true })
          updateGlobalMessage(client)
        }
      } else
        interaction.reply({ content: 'ERROR trying to add the player to the blacklist, please contact @Crylia', ephemeral: true })

      break
    } case 'blacklist-check-player': {
      const player = interaction.options.getString('player')

      const reason2 = await handleBlacklistCheck(player)
      reason2 ?
        await interaction.reply({ content: `** ${reason2.name}** is blacklisted for: ** ${reason2.reason || 'No reason provided.'}**`, ephemeral: true }) :
        await interaction.reply({ content: `** ${player}** is not blacklisted.`, ephemeral: true })

      break
    } case 'birthday': {
      const user = interaction.user.username
      const birthday = interaction.options.getString('birthday')

      // Matches format xx.xx.xxxx, later dd.mm.yyyy
      const match = birthday.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
      if (!match) {
        await interaction.reply({ content: 'Invalid date format. Please use dd.mm.yyyy.', ephemeral: true })
        return
      }

      const day = parseInt(match[1], 10)
      const month = parseInt(match[2], 10)
      const year = parseInt(match[3], 10)

      // Validates dd.mm ae legit, year doesnt matter for the birthday
      const isValidDate = (day, month, year) => {
        if (month < 1 || month > 12) return false

        const daysInMonth = [31, ((year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
        return day > 0 && day <= daysInMonth[month - 1]
      }

      if (!isValidDate(day, month, year)) {
        await interaction.reply({ content: 'Invalid date. Please enter a valid birthday as dd.mm.yyyy.', ephemeral: true })
        return
      }

      await handleBirthdayCheck(user, birthday).length > 0 ?
        await handleBirthdayUpdate(user, birthday) :
        handleBirthdayAdd(user, birthday) ?
          await interaction.reply({ content: `Set ${birthday} as your birthday.Everyone will be notified once the day arrives!`, ephemeral: true }) :
          await interaction.reply({ content: 'Something went wrong when setting / updating your birthday, please contact @crylia', ephemeral: true })
      break
    } case 'birthday-check': {
      const birthdayCheck = await handleBirthdayCheck(interaction.user.username)
      birthdayCheck ?
        await interaction.reply({ content: `Your birthday is currently set to ${new Date(birthdayCheck[0].date).toLocaleDateString('de-DE')}.`, ephemeral: true }) :
        await interaction.reply({ content: 'You don\'t have a birthday set. Use the`birthday` command to set one.', ephemeral: true })
      break
    } case 'birthday-delete': {
      await handleBirthdayDelete(interaction.user.username) ?
        await interaction.reply({ content: 'Your birthday has been deleted.', ephemeral: true }) :
        await interaction.reply({ content: 'You don\'t have a birthday set.', ephemeral: true })
      break
    } case 'static-delete': {
      const name = interaction.options.getString('name')
      const staticData = await handleStaticGet(name)

      if (!staticData) {
        await interaction.reply({ content: `Static **${name}** not found.`, ephemeral: true })
        break
      }

      try {
        const role = interaction.guild.roles.cache.get(staticData.role_id)
        const textCh = interaction.guild.channels.cache.get(staticData.text_channel_id)
        const voiceCh = interaction.guild.channels.cache.get(staticData.voice_channel_id)

        if (textCh) await textCh.delete()
        if (voiceCh) await voiceCh.delete()
        if (role) await role.delete()
      } catch (err) {
        console.error('Error cleaning up Discord resources:', err)
        await interaction.reply({ content: 'Static deleted from DB, but some Discord channels/roles could not be found or deleted.', ephemeral: true })
        await handleStaticDelete(name)
        break
      }

      const deleted = await handleStaticDelete(name)
      if (deleted) {
        await interaction.reply({ content: `Static **${name}** has been deleted successfully.`, ephemeral: true })
      } else {
        await interaction.reply({ content: 'Error deleting static from database.', ephemeral: true })
      }
      break
    } case 'static-create': {
      const name = interaction.options.getString('name')
      const size = interaction.options.getInteger('size')
      const creator = interaction.user.username
      const guild = interaction.guild

      await interaction.deferReply({ ephemeral: true })

      const existing = await handleStaticGet(name)
      if (existing) {
        await interaction.editReply(`❌ A static named **${name}** already exists.`)
        break
      }

      const category = guild.channels.cache.find(c =>
        c.type === ChannelType.GuildCategory && c.id === "1454779746583056427"
      )

      try {
        const role = await guild.roles.create({
          name: name,
          color: Colors.Blue,
          reason: `Static role for ${name}`,
        })

        const permissionOverwrites = [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: role.id,
            allow: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: client.user.id,
            allow: [PermissionFlagsBits.ViewChannel],
          }
        ]

        const textChannel = await guild.channels.create({
          name: `${name}-chat`,
          type: ChannelType.GuildText,
          parent: category ? category.id : "Statics",
          permissionOverwrites: permissionOverwrites,
        })

        const voiceChannel = await guild.channels.create({
          name: `${name}-voice`,
          type: ChannelType.GuildVoice,
          parent: category ? category.id : "Statics",
          permissionOverwrites: permissionOverwrites,
        })

        const memberList = [{ username: creator }]

        const success = await handleStaticAdd(
          name,
          creator,
          memberList,
          size,
          role.id,
          textChannel.id,
          voiceChannel.id
        )

        if (success) {
          await handleStaticUpdateUser(name, creator, 'add')

          const member = await guild.members.fetch(interaction.user.id)
          await member.roles.add(role)

          await interaction.editReply(`✅ Static **${name}** created!\n- Role: <@&${role.id}>\n- Channels: <#${textChannel.id}>`)
        } else {
          await textChannel.delete()
          await voiceChannel.delete()
          await role.delete()
          await interaction.editReply('❌ Database error. Rolled back Discord changes.')
        }

      } catch (error) {
        console.error('Error creating static:', error)
        await interaction.editReply('❌ An error occurred while creating Discord resources. Check bot permissions.')
      }
      break
    } case 'static-show': {
      const name = interaction.options.getString('name')
      const staticData = await handleStaticGet(name)

      if (staticData) {
        const memberList = staticData.members.length > 0 ? staticData.members.join(', ') : 'No members'
        await interaction.reply({
          content: `**Static:** ${staticData.name}\n**Creator:** ${staticData.creator}\n**Size:** ${staticData.size}\n**Members:** ${memberList}`,
          ephemeral: true
        })
      } else {
        await interaction.reply({ content: `Static **${name}** not found.`, ephemeral: true })
      }
      break
    } case 'static-member': {
      const action = interaction.options.getString('action')
      const staticName = interaction.options.getString('static')
      const user = interaction.options.getUser('user')

      const staticData = await handleStaticGet(staticName)
      if (!staticData) {
        await interaction.reply({ content: `Static **${staticName}** not found.`, ephemeral: true })
        break
      }

      const role = interaction.guild.roles.cache.get(staticData.role_id)
      const member = await interaction.guild.members.fetch(user.id)

      if (!role) {
        await interaction.reply({ content: 'Error: Static role not found in Discord.', ephemeral: true })
        break
      }

      if (action === 'add') {
        const status = await handleStaticUpdateUser(staticName, user.username, 'add')

        if (status === 'success') {
          await member.roles.add(role)
          await interaction.reply({ content: `✅ Added **${user.username}** to static **${staticName}**.`, ephemeral: true })
        } else if (status === 'full') {
          await interaction.reply({ content: `❌ Static **${staticName}** is full! (${staticData.members.length}/${staticData.size})`, ephemeral: true })
        } else if (status === 'already_joined') {
          await member.roles.add(role)
          await interaction.reply({ content: `qp **${user.username}** is already in **${staticName}**.`, ephemeral: true })
        } else {
          await interaction.reply({ content: '❌ Database error: Could not add member.', ephemeral: true })
        }

      } else {
        const status = await handleStaticUpdateUser(staticName, user.username, 'remove')

        if (status === 'success') {
          await member.roles.remove(role)
          await interaction.reply({ content: `✅ Removed **${user.username}** from static **${staticName}**.`, ephemeral: true })
        } else {
          await interaction.reply({ content: '❌ Database error: Could not remove member.', ephemeral: true })
        }
      }
      break
    } case 'showrole': {
      await showRoleMembers(interaction)
      break
    } case 'event-list': {
      const events = await ReadEvents()
      if (!events || events.length === 0) {
        await interaction.reply({ content: 'No events scheduled.', ephemeral: true })
        break
      }

      const listString = events.map(e =>
        `**ID: ${e.schedule_id}** | ${e.event_name} | ${e.day_of_week || 'Daily'} | ${e.start_time} - ${e.end_time}`
      ).join('\n')

      await interaction.reply({ content: `**Current Event Schedule:**\n${listString}`, ephemeral: true })
      break
    } case 'event-add': {
      const name = interaction.options.getString('name')
      const start = interaction.options.getString('start_time')
      const end = interaction.options.getString('end_time')
      const day = interaction.options.getString('day') || null

      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/
      if (!timeRegex.test(start) || !timeRegex.test(end)) {
        await interaction.reply({ content: 'Invalid time format. Please use HH:MM or HH:MM:SS', ephemeral: true })
        break
      }

      const success = await CreateEventSchedule(name, day, start, end)

      if (success) {
        await refreshEventCache()
        await interaction.reply({ content: `✅ Event "**${name}**" added successfully!`, ephemeral: true })
      } else {
        await interaction.reply({ content: '❌ Failed to add event. Check logs.', ephemeral: true })
      }
      break
    } case 'event-remove': {
      const id = interaction.options.getInteger('id')
      const success = await DeleteEventSchedule(id)

      if (success) {
        await refreshEventCache()
        await interaction.reply({ content: `✅ Event Schedule ID **${id}** deleted.`, ephemeral: true })
      } else {
        await interaction.reply({ content: `❌ Could not find or delete Event ID **${id}**.`, ephemeral: true })
      }
      break
    } default: {
      break
    }
  }
})

/* client.on('messageReactionAdd', async (reaction, user) => {
  messageReactionAdd(user, reaction)
})

client.on('messageReactionRemove', async (reaction, user) => {
  messageReactionRemove(user, reaction)
}) */

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag} `)

  const unauthorizedGuilds = client.guilds.cache.filter(guild => guild.id !== process.env.SERVER_ID)
  const leavePromises = unauthorizedGuilds.map(async guild => {
    console.log(`Leaving unauthorized server: ${guild.id}`);
    await guild.leave();
  })

  await Promise.all(leavePromises)

  startBirthdayCheckCron(client)
  startEventCheckCron(client)
  updateGlobalMessage(client)
  //initReactionPerRole(client)
})

client.on('guildCreate', guild => {
  if (guild.id !== process.env.SERVER_ID) {
    console.log(`Unauthorized server joined: ${guild.name} (${guild.id})`)
    guild.leave()
      .then(() => console.log(`Left unauthorized server: ${guild.name}`))
      .catch(console.error)
  }
})

client.on('guildDelete', guild => {
  console.log(`Bot removed from server: ${guild.name} (${guild.id})`)
})

const connectDiscord = async () => {
  try {
    console.log('Started refreshing application (/) commands.')

    const commands = [
      new SlashCommandBuilder()
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .setName('event-remove')
        .setDescription('Remove an event schedule by ID')
        .addIntegerOption(option =>
          option.setName('id').setDescription('The Schedule ID (use /event-list to find this)').setRequired(true)),
      new SlashCommandBuilder()
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .setName('event-add')
        .setDescription('Add a new event schedule')
        .addStringOption(option =>
          option.setName('name').setDescription('Name of the event').setRequired(true))
        .addStringOption(option =>
          option.setName('start_time').setDescription('Start Time (HH:MM:SS) in Germany Time').setRequired(true))
        .addStringOption(option =>
          option.setName('end_time').setDescription('End Time (HH:MM:SS) in Germany Time').setRequired(true))
        .addStringOption(option =>
          option.setName('day').setDescription('Day of week (e.g. Monday). Leave empty for Daily.').setRequired(false)),
      new SlashCommandBuilder()
        .setName('event-list')
        .setDescription('List all active event schedules and their IDs'),
      new SlashCommandBuilder()
        .setName('birthday')
        .setDescription('Set yourself a birthday')
        .addStringOption(option =>
          option.setName('birthday')
            .setDescription('Set (or overwrite) your birthday as dd.mm.yyyy (e.g. 01.12.1999)')
            .setRequired(true)
        ),
      new SlashCommandBuilder()
        .setName('birthday-check')
        .setDescription('Check your set birthday (only you will see the date)'),
      new SlashCommandBuilder()
        .setName('birthday-delete')
        .setDescription('Delete your birthday, nobody will know when your birthday arrives :('),
      new SlashCommandBuilder()
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .setName('blacklist')
        .setDescription('Add a player to a blacklist with a reason')
        .addStringOption(option =>
          option.setName('player')
            .setDescription('The in-game name of the player')
            .setRequired(true)
        )
        .addStringOption(option =>
          option.setName('reason')
            .setDescription('Explain what happened, why should this player be blacklisted')
            .setRequired(true)
        ),
      new SlashCommandBuilder()
        .setName('blacklist-check-player')
        .setDescription('Check if a player is blacklisted')
        .addStringOption(option =>
          option.setName('player')
            .setDescription('The in-game name of the player')
            .setRequired(true)
        ),
      new SlashCommandBuilder()
        .setName('showrole')
        .setDescription('Shows all users with a given role')
        .addRoleOption(option =>
          option.setName('role')
            .setDescription('The role to look up')
            .setRequired(true)
        ),
      new SlashCommandBuilder()
        .setName('static-delete')
        .setDescription('Delete a static and its channels')
        .addStringOption(option =>
          option.setName('name')
            .setDescription('Name of the static to delete')
            .setRequired(true)
        ),
      new SlashCommandBuilder()
        .setName('static-show')
        .setDescription('Show details of a static')
        .addStringOption(option =>
          option.setName('name')
            .setDescription('Name of the static')
            .setRequired(true)
        ),
      new SlashCommandBuilder()
        .setName('static-create')
        .setDescription('Create a new static with channels and role')
        .addStringOption(option =>
          option.setName('name')
            .setDescription('Name of the static (e.g. "Kyumgall")')
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName('size')
            .setDescription('Max size of the static')
            .setRequired(true)),
      new SlashCommandBuilder()
        .setName('static-member')
        .setDescription('Manage members of a static')
        .addStringOption(option =>
          option.setName('action')
            .setDescription('add or remove')
            .setRequired(true)
            .addChoices(
              { name: 'Add', value: 'add' },
              { name: 'Remove', value: 'remove' }
            )
        )
        .addStringOption(option =>
          option.setName('static')
            .setDescription('Name of the static')
            .setRequired(true)
        )
        .addUserOption(option =>
          option.setName('user')
            .setDescription('The user to add/remove')
            .setRequired(true)
        ),
    ].map(command => command.toJSON())

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.SERVER_ID),
      { body: commands }
    )
    console.log('Successfully reloaded application (/) commands.')
  } catch (error) {
    console.error(error)
  }
  try {
    client.login(process.env.BOT_TOKEN)
  } catch (error) {
    console.error('Error logging in to Discord:', error)
  }
}

module.exports = { client, connectDiscord }
