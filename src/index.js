const { connectDiscord } = require('./discord/discordClient')
const { connectDatabase, createClient } = require('./database/database');
require('dotenv').config();

(async () => {
	try {
		const client = createClient({
			connectionString: `postgresql://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}/${process.env.DB_NAME}`
		})
		connectDatabase(client).then(() => {
			connectDiscord()
		})
	} catch (error) {
		console.log(error)
	}
})()
