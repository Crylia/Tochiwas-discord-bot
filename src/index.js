const { connectDiscord } = require('./discord/discordClient')
const { connectDatabase } = require('./database/database');

(async () => {
	try {
		await connectDatabase()
		await connectDiscord()
	} catch (error) {
		console.log(error)
	}
})()
