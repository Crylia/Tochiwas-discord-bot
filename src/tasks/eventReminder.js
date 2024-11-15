const cron = require('node-cron')
const { ReadEvents, GetEventRole } = require('../database/eventdb')
const { EmbedBuilder } = require('discord.js')

let eventCache = []

const FetchEvents = async () => {
  const res = await ReadEvents()

  eventCache = res
}

const convertToISO = (time, date) => {
  const utcDate = new Date(`${date}T${time}`)
  utcDate.setHours(utcDate.getHours())
  return utcDate.toISOString().split('.')[0]
}

const convertToUTC = (time) => {
  const [hours, minutes, seconds] = time.split(':').map(Number)
  const date = new Date()
  date.setUTCHours(hours - 1, minutes, seconds)
  return date.toISOString().split('.')[0]
}

const isReminderTime = (eventStartUTC) => {
  const now = new Date()
  const [eventHours, eventMinutes] = eventStartUTC.split('T')[1].split(':').map(Number)
  const eventStartDateTime = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), eventHours, eventMinutes))
  const reminderTime = new Date(eventStartDateTime.getTime() - 15 * 60 * 1000)
  console.log(now, reminderTime, eventStartDateTime)
  return now >= reminderTime && now < eventStartDateTime
}

const getDayOfWeek = () => new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate())).toLocaleDateString('en-US', { weekday: 'long' })

const startEventCheckCron = async (client) => {
  cron.schedule('45 * * * *', async () => {
    await FetchEvents()

    for (const [_, oauthGuild] of await client.guilds.fetch()) {
      const guild = await oauthGuild.fetch()
      const channel = (await guild.channels.fetch()).find(ch => ch.name === 'reminder')

      if (!channel) continue

      eventCache.forEach(async (event) => {
        let { schedule_id, event_name, start_time, end_time, day_of_week } = event
        if (!((!day_of_week || day_of_week === getDayOfWeek()) && isReminderTime(convertToUTC(start_time)))) return
        const rolesEventMap = await GetEventRole()
        const role = guild.roles.cache.find(r => r.name === rolesEventMap.get(event_name))
        const roleId = role ? role.id : null

        const embed = new EmbedBuilder()
          .setTitle(event_name)
          .setDescription(`${event_name} starts at **${start_time} CEST** and ends at **${end_time} CEST**. \n ${roleId ? `<@&${roleId}>` : 'No role assigned'} \n`)
          .addFields(
            { name: 'Day of Week', value: day_of_week ? day_of_week : 'Daily', inline: true },
            {
              name: 'Compare Time',
              value: `[Click here to compare event time to your local time](https://www.timeanddate.com/worldclock/fixedtime.html?iso=${convertToISO(start_time, new Date().toISOString().split('T')[0])}&msg=${encodeURIComponent(event_name)})`,
              inline: true
            }
          )
          .setFooter({ text: `Schedule ID: ${schedule_id}` })
          .setColor('#00FF00')

        await channel.send({ embeds: [embed] }).catch(console.error)
      })
    }
  })
  cron.schedule('0 6 * * *', async () => {
    for (const [_, oauthGuild] of await client.guilds.fetch()) {
      const guild = await oauthGuild.fetch()
      const channel = (await guild.channels.fetch()).find(ch => ch.name === 'reminder')

      if (!channel) continue

      try {
        const messages = await channel.messages.fetch({ limit: 1000 })
        messages.forEach(async (message) => {
          await message.delete().catch(console.error)
        })
      } catch (error) {
        console.error('Error clearing messages:', error)
      }
    }
  })
}



module.exports = {
  startEventCheckCron,
}
