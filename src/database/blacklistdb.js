const { 
  blacklist: Blacklist, 
  discorduser: DiscordUser, 
} = require('./models')

const CreateBlacklist = async (reportedUser, reason, reportedByUser) => {
  try {
    const existingBlacklist = await Blacklist.findOne({
      where: {
        name: reportedUser,
      },
    })

    if (existingBlacklist) return existingBlacklist

    const [reportingUser] = await DiscordUser.findOrCreate({
      where: {
        name: reportedByUser,
      },
      defaults: {
        name: reportedByUser,
      },
    })

    const blacklistEntry = await Blacklist.create({
      name: reportedUser,
      reason,
      reportedby: reportingUser.name,
    })

    return blacklistEntry !== null
  } catch (error) {
    console.error('Error creating blacklist entry:', error)
    return false
  }
}

const ReadBlacklist = async (userName) => {
  try {
    if (userName) {
      const blacklistEntry = await Blacklist.findOne({
        where: {
          name: userName,
        },
      })
      return blacklistEntry || false
    } else {
      const allBlacklistEntries = await Blacklist.findAll()
      return allBlacklistEntries
    }
  } catch (error) {
    console.error('Error reading blacklist table:', error)
    return []
  }
}

const UpdateBlacklist = async (reportedUser, reason) => {
  try {
    if (!reportedUser) return false

    const [updated] = await Blacklist.update(
      { reason },
      {
        where: {
          name: reportedUser,
        },
      }
    )

    return updated > 0
  } catch (error) {
    console.error('Error updating blacklist table:', error)
    return false
  }
}

const DeleteBlacklist = async (userName) => {
  try {
    if (!userName) return false

    const deleted = await Blacklist.destroy({
      where: {
        name: userName,
      },
    })

    return deleted > 0
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
