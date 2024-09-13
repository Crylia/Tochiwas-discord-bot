const { Client } = require('pg')


let client = null

const createClient = (config) => {
	client = new Client(config);
	return client;
};

const connectDatabase = async (client) => {
	try {
		await client.connect()
		console.log('Database connected')
	} catch (error) {
		console.error('Database connection error:', error)
		throw new Error('Connection failed');
	}
}

const getClient = () => {
	if (!client) {
		throw new Error('Client has not been initialized. Call createClient first.');
	}
	return client;
};

module.exports = {
	createClient,
	connectDatabase,
	getClient,
}
