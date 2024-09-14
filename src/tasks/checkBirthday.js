const cron = require('node-cron')
const { handleBirthdayGetAll } = require('../features/birthday')

const startBirthdayCheckCron = async (client) => {
  cron.schedule('0 20 * * *', async () => {
    try {
      console.log('Running birthday check...')

      for (const [guildId, oauthGuild] of await client.guilds.fetch()) {
        const guild = await oauthGuild.fetch()
        const birthdayChannel = (await guild.channels.fetch()).find(ch => ch.name === 'main')

        if (!birthdayChannel) continue

        const birthdays = await handleBirthdayGetAll()
        console.log('birthdays:', birthdays)
        if (birthdays.length < 1) continue

        let message = '🎉 **Today\'s Birthdays!** 🎉\n\n'
        for (const birthday of birthdays) {
          const birthdayDate = new Date(birthday.date)
          if (birthdayDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) === new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })) {
            (await guild.members.fetch()).forEach(user => {
              if (user.user.username === birthday.discorduser) {
                message += `🎂 **Happy Birthday, <@${user.id}>!** 🎂\nWishing you a fantastic day filled with joy and surprises! 🎁🎈\n\n**Everyone, make sure to wish <@${user.id}> a wonderful birthday!** 🎊🎉\n\n`
              }
            })
          }
        }
        console.log(message)
        if (message !== '🎉 **Today\'s Birthdays!** 🎉\n\n') {
          await birthdayChannel.send(message)
        }
      }
    } catch (error) {
      console.log('Error in scheduled birthday check:', error)
    }
  })
}

module.exports = { startBirthdayCheckCron }
