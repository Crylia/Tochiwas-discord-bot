const { Client } = require('pg')
require('dotenv').config()

const DB_USER = process.env.DB_USER
const DB_HOST = process.env.DB_HOST
const DB_NAME = process.env.DB_NAME
const DB_PASS = process.env.DB_PASS

const client = new Client({
	connectionString: `postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}/${DB_NAME}`
})

const connectDatabase = async () => {
	try {
		await client.connect()
		console.log('Database connected')
	} catch (error) {
		console.error('Database connection error:', err)
	}
}

module.exports = {
	client,
	connectDatabase,
}
