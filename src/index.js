const { connectDiscord } = require('./discord/discordClient')


void (async () => {
  try {
    connectDiscord()
  } catch (error) {
    console.error('Error initializing application:', error)
  }
})()
