const { Client, GatewayIntentBits, EmbedBuilder, Partials, Routes } = require('discord.js')
const { REST } = require('@discordjs/rest')
const { SlashCommandBuilder } = require('@discordjs/builders')

const {
	handleBlacklistAdd,
	handleBlacklistCheck,
	handleBlacklistShow,
} = require('../features/blacklist')
const {
	handleBirthdayAdd,
	handleBirthdayUpdate,
	handleBirthdayCheck,
	handleBirthdayDelete,
} = require('../features/birthday')

const { startBirthdayCheckCron } = require('../tasks/checkBirthday')

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMembers,
	],
	partials: [
		Partials.Channel,
	]
})

const createBlacklistEmbeds = (entries) => {
	const embeds = [];
	let currentEmbed = new EmbedBuilder()
		.setTitle('Blacklisted Players')
		.setColor('#EF9A9A');

	let currentEntries = [];
	let first = true;

	const breakTextIntoLines = (text, maxLength) => {
		const words = text.split(' ');
		const lines = [];
		let currentLine = '';

		for (let i = 0; i < words.length; i++) {
			if (words[i].length > maxLength) {
				const splitWord = words[i].match(new RegExp(`.{1,${maxLength}}`, 'g')) || [];
				for (let j = 0; j < splitWord.length; j++) {
					if (j === 0 && currentLine) {
						lines.push(currentLine.trim());
						currentLine = '';
					}
					lines.push(splitWord[j]);
				}
			} else if ((currentLine + words[i]).length <= maxLength) {
				currentLine += words[i] + ' ';
			} else {
				lines.push(currentLine.trim());
				currentLine = words[i] + ' ';
			}
		}

		if (currentLine) {
			lines.push(currentLine.trim());
		}

		return lines;
	};

	const addEntryToEmbed = (entriesGroup) => {
		let playerNames = '';
		let reasons = '';
		let reportedBys = '';

		for (let i = 0; i < entriesGroup.length; i++) {
			const entry = entriesGroup[i];
			const name = entry.name || 'Unknown';
			const reason = entry.reason || 'No reason provided';

			const nameLines = breakTextIntoLines(name, 20);
			const reasonLines = breakTextIntoLines(reason, 30);

			const maxLines = Math.max(nameLines.length, reasonLines.length);

			for (let j = 0; j < maxLines; j++) {
				playerNames += (j < nameLines.length ? nameLines[j] : '\u200B') + '\n';
				reasons += (j < reasonLines.length ? reasonLines[j] : '\u200B') + '\n';
				reportedBys += (j === 0 ? entry.reportedby || 'Unknown' : '\u200B') + '\n';
			}
		}

		let newFields = [];
		if (first) {
			newFields = [
				{ name: 'Player', value: playerNames, inline: true },
				{ name: 'Reason', value: reasons, inline: true },
				{ name: 'Reported By', value: reportedBys, inline: true }
			];
			first = false;
		} else {
			newFields = [
				{ name: '\u200B', value: playerNames, inline: true },
				{ name: '\u200B', value: reasons, inline: true },
				{ name: '\u200B', value: reportedBys, inline: true }
			];
		}

		for (const field of newFields) {
			currentEmbed.addFields(field);
		}
	};

	for (let i = 0; i < entries.length; i++) {
		const entry = entries[i];

		const tempEntries = [...currentEntries, entry];
		let tempPlayerNames = '';
		let tempReasons = '';
		let tempReportedBys = '';

		for (let j = 0; j < tempEntries.length; j++) {
			const name = tempEntries[j].name || 'Unknown';
			const reason = tempEntries[j].reason || 'No reason provided';
			const nameLines = breakTextIntoLines(name, 20);
			const reasonLines = breakTextIntoLines(reason, 30);

			const maxLines = Math.max(nameLines.length, reasonLines.length);

			for (let k = 0; k < maxLines; k++) {
				tempPlayerNames += (k < nameLines.length ? nameLines[k] : '\u200B') + '\n';
				tempReasons += (k < reasonLines.length ? reasonLines[k] : '\u200B') + '\n';
				tempReportedBys += (k === 0 ? tempEntries[j].reportedby || 'Unknown' : '\u200B') + '\n';
			}
		}

		const exceedsLimit = (str) => str.length > 1024;

		if (exceedsLimit(tempPlayerNames) || exceedsLimit(tempReasons) || exceedsLimit(tempReportedBys)) {
			if (currentEntries.length > 0) {
				addEntryToEmbed(currentEntries);
				currentEntries = [];
			}
		}

		currentEntries.push(entry);
	}

	if (currentEntries.length > 0) {
		addEntryToEmbed(currentEntries);
	}

	embeds.push(currentEmbed);

	return embeds;
};


const updateGlobalMessage = async () => {
	try {
		let targetChannel = null;

		for (const [_, oauthGuild] of await client.guilds.fetch()) {
			targetChannel = (await (await oauthGuild.fetch()).channels.fetch()).find(ch => ch.name === 'blacklist')
			break;
		}

		if (!targetChannel) {
			console.error('Channel with name "blacklist" not found.');
			return;
		}

		const messages = await targetChannel.messages.fetch({ limit: 100 });
		await Promise.all(messages.map(msg => msg.delete()));

		const blacklistEntries = await handleBlacklistShow();
		const embeds = createBlacklistEmbeds(blacklistEntries);

		for (const embed of embeds)
			await targetChannel.send({ embeds: [embed] });

	} catch (error) {
		console.error('Error updating global message:', error);
	}
};

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
				await interaction.reply({ content: `** ${reason2.name}** is blacklisted for: ** ${reason2.reason || 'No reason provided.'}** (by ${reason2.reportedby || 'unknown'}).`, ephemeral: true }) :
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
		default:
			break
	}
})

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN)

client.once('ready', async () => {
	console.log(`Logged in as ${client.user.tag} `)
	startBirthdayCheckCron(client)
	updateGlobalMessage()
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
