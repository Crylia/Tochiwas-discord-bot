const { Client, GatewayIntentBits, Partials, Routes } = require('discord.js')
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

const { startBirthdayCheckCron } = require('../tasks/checkBirthday')
const { startEventCheckCron } = require('../tasks/eventReminder')

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
	]
})

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return

	switch (interaction.commandName) {
		case 'blacklist':
			const reportedUser = interaction.options.getString('player')
			const reason = interaction.options.getString('reason')
			const reportedByUser = interaction.user.username

			const res = await handleBlacklistAdd(reportedUser, reason, reportedByUser)
			if (res) {
				if (res.name === reportedUser)
					interaction.reply({ content: `This user has already been reported`, ephemeral: true })
				else {
					interaction.reply({ content: `Player ** ${reportedUser}** had been successfully reported for ${reason}`, ephemeral: true })
					updateGlobalMessage(interaction)
				}
			} else
				interaction.reply({ content: `ERROR trying to add the player to the blacklist, please contact @Crylia`, ephemeral: true })

			break
		case 'blacklist-check-player':
			const player = interaction.options.getString('player')

			const reason2 = await handleBlacklistCheck(player)
			reason2 ?
				await interaction.reply({ content: `** ${reason2.name}** is blacklisted for: ** ${reason2.reason || 'No reason provided.'}**`, ephemeral: true }) :
				await interaction.reply({ content: `** ${player}** is not blacklisted.`, ephemeral: true })

			break
		case 'birthday':
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
					await interaction.reply({ content: `Something went wrong when setting / updating your birthday, please contact @crylia`, ephemeral: true })
			break
		case 'birthday-check':
			const birthdayCheck = await handleBirthdayCheck(interaction.user.username)
			birthdayCheck ?
				await interaction.reply({ content: `Your birthday is currently set to ${new Date(birthdayCheck[0].date).toLocaleDateString('de-DE')}.`, ephemeral: true }) :
				await interaction.reply({ content: "You don't have a birthday set. Use the`birthday` command to set one.", ephemeral: true })
			break
		case 'birthday-delete':
			await handleBirthdayDelete(interaction.user.username) ?
				await interaction.reply({ content: "Your birthday has been deleted.", ephemeral: true }) :
				await interaction.reply({ content: "You don't have a birthday set.", ephemeral: true })
			break
		case 'static-create':

			break
		case 'static-delete':

			break

		case 'static-show':

			break
		default:
			break
	}
})

client.on('messageReactionAdd', async (reaction, user) => {
	messageReactionAdd(user, reaction)
})

client.on('messageReactionRemove', async (reaction, user) => {
	messageReactionRemove(user, reaction)
})


const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN)

client.once('ready', async () => {
	console.log(`Logged in as ${client.user.tag} `)
	startBirthdayCheckCron(client)
	startEventCheckCron(client)
	updateGlobalMessage(client)
	initReactionPerRole(client)
})

const connectDiscord = async () => {
	try {
		console.log('Started refreshing application (/) commands.')

		const commands = [
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
				)
		].map(command => command.toJSON())

		await rest.put(
			Routes.applicationCommands(process.env.CLIENT_ID),
			{ body: commands },
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
