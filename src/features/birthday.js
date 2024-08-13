const { CreateBirthday, ReadBirthday, UpdateBirthday, DeleteBirthday } = require('../database/birthdaydb')

const handleBirthdayAdd = async (user, birthday) => {
	if (!user || !birthday) return false

	const result = await CreateBirthday(user, birthday)

	return result
}

const handleBirthdayCheck = async (user) => {
	if (!user) return false

	const result = await ReadBirthday(user)

	return result
}

const handleBirthdayDelete = async (user) => {
	if (!user) return false

	const result = await DeleteBirthday(user)

	return result
}

const handleBirthdayUpdate = async (user, birthday) => {
	if (!user || !birthday) return false

	const result = await UpdateBirthday(user, birthday)

	return result
}

const handleBirthdayGetAll = async () => await ReadBirthday()

module.exports = {
	handleBirthdayAdd,
	handleBirthdayCheck,
	handleBirthdayDelete,
	handleBirthdayUpdate,
	handleBirthdayGetAll,
}
