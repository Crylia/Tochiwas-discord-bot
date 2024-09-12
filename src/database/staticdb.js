const { client } = require('./database')

const CreateStatic = async (name, creator, members, size) => {
	try {
		await client.query(`
			INSERT INTO static (name, creator, size)
       VALUES ($1, $2, $3)
       RETURNING id;`,
			[name, creator, size]
		)

		const staticId = result.rows[0].id;

		const memberValues = members.map(member => `(${staticId}, '${member}')`).join(',')

		await client.query(`
			INSERT INTO static_members (static_id, member)
      VALUES ${memberValues};`
		)

		return true
	} catch (error) {
		console.error('Error creating static entry:', error)
		return false
	}
}

const ReadStatic = async (name) => {
	try {
		const res = await client.query(`
			SELECT * FROM static
			WHERE name = $1;`,
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
		await client.query(`
			DELETE FROM static
			WHERE name = $1;`,
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
