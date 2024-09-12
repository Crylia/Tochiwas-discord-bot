const cron = require('node-cron');
const { ReadEvents, GetEventRole } = require('../database/eventdb')
const { EmbedBuilder } = require('discord.js')

let eventCache = []

const FetchEvents = async () => {
	const res = await ReadEvents()

	eventCache = res
}

const convertToISO = (time, date) => {
	const utcDate = new Date(`${date}T${time}`);
	utcDate.setHours(utcDate.getHours());
	return utcDate.toISOString().split('.')[0];
};

const convertToUTC = (time) => {
	const [hours, minutes, seconds] = time.split(':').map(Number);
	const date = new Date();
	date.setUTCHours(hours - 2, minutes, seconds);
	return date.toISOString().split('.')[0];
};

const isReminderTime = (eventStartUTC) => {
	const now = new Date();
	const [eventHours, eventMinutes] = eventStartUTC.split('T')[1].split(':').map(Number);
	const eventStartDateTime = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), eventHours, eventMinutes));
	const reminderTime = new Date(eventStartDateTime.getTime() - 15 * 60 * 1000);
	console.log(now, reminderTime, eventStartDateTime)
	return now >= reminderTime && now < eventStartDateTime;
};

const getDayOfWeek = () => new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate())).toLocaleDateString('en-US', { weekday: 'long' });

const startEventCheckCron = async (client) => {
	cron.schedule('45 * * * *', async () => {
		console.log('Checking for events...')
		if (!eventCache.length) {
			await FetchEvents();
		}

		const rolesEventMap = await GetEventRole()

		for (const [guildId, oauthGuild] of await client.guilds.fetch()) {
			const guild = await oauthGuild.fetch()
			const channel = (await guild.channels.fetch()).find(ch => ch.name === 'reminder')

			if (!channel) continue

			eventCache.forEach(event => {
				let { schedule_id, event_name, start_time, end_time, day_of_week } = event;
				console.log(!((!day_of_week || day_of_week === getDayOfWeek()) && isReminderTime(convertToUTC(start_time))))
				// Abbort if its not time to send a reminder
				if (!((!day_of_week || day_of_week === getDayOfWeek()) && isReminderTime(convertToUTC(start_time)))) return;

				const timeComparisonLink = `https://www.timeanddate.com/worldclock/fixedtime.html?iso=${convertToISO(start_time, new Date().toISOString().split('T')[0])}&msg=${encodeURIComponent(event_name)}`;

				console.log("Sending event...")
				console.log(rolesEventMap.get(event_name))
				const embed = new EmbedBuilder()
					.setTitle(event_name)
					.setDescription(`${event_name} starts at **${start_time} CEST** and ends at **${end_time} CEST**. \n<@${rolesEventMap.get(event_name)}>\n`)
					.addFields(
						{ name: 'Day of Week', value: day_of_week ? day_of_week : 'Daily', inline: true },
						{ name: 'Compare Time', value: `[Click here to compare event time to your local time](${timeComparisonLink})`, inline: true }
					)
					.setFooter({ text: `Schedule ID: ${schedule_id}` })
					.setColor('#00FF00');

				channel.send({ embeds: [embed] }).catch(console.error);
			});
		}
	});
}

module.exports = {
	startEventCheckCron,
}
