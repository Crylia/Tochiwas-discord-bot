const { client } = require('./database')

const CreateBlacklist = async (reportedUser, reason, reportedByUser) => {
	try {
		const alreadyReportedResult = await client.query(`
			SELECT name FROM blacklist
			WHERE name = $1`,
			[reportedUser]
		)

		if (alreadyReportedResult.rows.length === 1) {
			return alreadyReportedResult.rows[0]
		}

		const userResult = await client.query(`
			SELECT * FROM discorduser
			WHERE name = $1;`,
			[reportedByUser]
		)

		if (userResult.rows.length === 0) {
			await client.query(`
				INSERT INTO discorduser (name)
				VALUES ($1);`,
				[reportedByUser]
			)
		}

		await client.query(`
			INSERT INTO blacklist (name, reason, reportedby)
			VALUES ($1, $2, $3);`,
			[reportedUser, reason, reportedByUser]
		)

		return true
	} catch (error) {
		console.error('Error creating blacklist entry:', error)
		return false
	}
}

const ReadBlacklist = async (user) => {
	try {
		if (user) {
			const res = await client.query(`
				SELECT * FROM blacklist
				WHERE name=$1`,
				[user]
			)
			return res.rows[0] || false
		} else {
			const res = await client.query(`
				SELECT * FROM blacklist`
			)
			return res.rows
		}
	} catch (error) {
		console.error('Error reading blacklist table:', error)
		return []
	}
}

const UpdateBlacklist = async (reportedUser, reason) => {
	try {
		if (!reportedUser) return false

		await client.query(`
			UPDATE blacklist
			SET reason = $2
			WHERE name = $1;`,
			[reportedUser, reason]
		)
		return true
	} catch (error) {
		console.error('Error updating blacklist table:', error)
		return false
	}
}

const DeleteBlacklist = async (user) => {
	try {
		if (!user) return false

		await client.query(`
			DELETE FROM blacklist
			WHERE name = $1;`,
			[user]
		)
		return true
	} catch (error) {
		console.error('Error deleting blacklist table:', error)
		return false
	}
}

module.exports = {
	CreateBlacklist,
	ReadBlacklist,
	UpdateBlacklist,
	DeleteBlacklist,
}
