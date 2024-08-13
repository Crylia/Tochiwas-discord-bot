const { CreateBlacklist, ReadBlacklist, UpdateBlacklist, DeleteBlacklist } = require('../database/blacklistdb')

const handleBlacklistAdd = async (reportedUser, reason, reportedByUser) => {
	if (!reportedUser || !reason || !reportedByUser) return false

	const result = await CreateBlacklist(reportedUser, reason, reportedByUser)

	return result
}

const handleBlacklistCheck = async (user) => {
	if (!user) return false

	const result = await ReadBlacklist(user)

	return result
}

const handleBlacklistShow = async () => await ReadBlacklist()

module.exports = {
	handleBlacklistAdd,
	handleBlacklistCheck,
	handleBlacklistShow,
}
