const { getClient } = require('./database')

const CreateBirthday = async (user, birthday) => {
	try {
		const client = getClient()
		const userResult = await client.query(`
			SELECT * FROM discorduser
			WHERE name = $1;`,
			[user]
		)

		if (userResult.rows.length === 0) {
			await client.query(`
				INSERT INTO discorduser (name)
				VALUES ($1);`,
				[user]
			)
		}

		const res = await client.query(`
			INSERT INTO birthday (date, discorduser)
			VALUES ($1, $2);`,
			[new Date(birthday.split('.').reverse().join('-')).toISOString().slice(0, 10), user]
		)

		return res.rowCount > 0
	} catch (error) {
		console.error('Error creating birthday entry:', error)
		return false
	}
}

const ReadBirthday = async (user) => {
	try {
		const client = getClient()

		if (user) {
			const res = await client.query(`
			SELECT * FROM birthday
			WHERE discorduser = $1;`,
				[user]
			)
			return res.rows
		} else {
			const res = await client.query(`
				SELECT * FROM birthday`,
			)
			return res.rows
		}
	} catch (error) {
		console.error('Error reading birthday table:', error)
		return []
	}
}

const UpdateBirthday = async (user, birthday) => {
	try {
		const client = getClient()

		if (!birthday) return false

		await client.query(`
			UPDATE birthday
			SET birthday = $2
			WHERE discorduser = $1;`,
			[user, birthday]
		)

		return true
	} catch (error) {
		console.error('Error updating birthday table:', error)
		return false
	}
}

const DeleteBirthday = async (user) => {
	try {
		const client = getClient()

		if (!user) return false

		await client.query(`
			DELETE FROM birthday
			WHERE discorduser = $1;`,
			[user]
		)

		return true
	} catch (error) {
		console.error('Error deleting birthday table:', error)
		return false
	}
}

module.exports = {
	CreateBirthday,
	ReadBirthday,
	UpdateBirthday,
	DeleteBirthday,
}
