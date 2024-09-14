const { Sequelize } = require('sequelize')
const { connectDiscord } = require('./discord/discordClient')
require('dotenv').config();

(async () => {
  try {

    connectDiscord()

  } catch (error) {
    console.error('Error initializing application:', error)
  }
})()
