const { getClient } = require('./database')

const CreateStatic = async (name, creator, members, size) => {
	try {
		const client = getClient()

		const result = await client.query(
			"INSERT INTO static (name, creator, size) VALUES ($1, $2, $3) RETURNING id",
			[name, creator, size]
		)

		const staticId = result.rows[0].id

		for (const member of members) {
			await client.query(
				"INSERT INTO static_members (static_id, member) VALUES ($1, $2)",
				[staticId, member]
			)
		}

		return true
	} catch (error) {
		console.error('Error creating static entry:', error)
		return false
	}
}

const ReadStatic = async (name) => {
	try {
		const client = getClient()

		const res = await client.query(
			"SELECT * FROM static WHERE name = $1",
			[name]
		)
		return res.rows
	} catch (error) {
		console.error('Error reading static entry:', error)
		return false
	}
}

const DeleteStatic = async (name) => {
	try {
		const client = getClient()

		await client.query(
			"DELETE FROM static WHERE name = $1",
			[name]
		)
	} catch (error) {
		console.error('Error deleting static entry:', error)
		return false
	}
}

module.exports = {
	CreateStatic,
	ReadStatic,
	DeleteStatic,
}
