const { client } = require('./database')

const CreateBirthday = async (user, birthday) => {
	try {
		const alreadyReportedResult = await client.query(`
			SELECT discorduser FROM birthday
			WHERE discorduser = $1;`,
			[user]
		)

		if (alreadyReportedResult.rows.length === 1) {
			return alreadyReportedResult.rows[0]
		}

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

		await client.query(`
			INSERT INTO birthday (date, discorduser)
			VALUES ($1, $2);`,
			[new Date(birthday.split('.').reverse().join('-')).toISOString().slice(0, 10), user]
		)

		return true
	} catch (error) {
		console.error('Error creating birthday entry:', error)
		return false
	}
}

const ReadBirthday = async (user) => {
	try {
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
