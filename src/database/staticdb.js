const { 
  static: Static, 
  static_members: StaticMembers, 
  discorduser: DiscordUser, 
} = require('./models')

const CreateStatic = async (name, creator, members, size) => {
  try {
    const staticEntry = await Static.create({
      name,
      creator,
      size,
    })

    const staticId = staticEntry.id

    await Promise.all(
      members.map(async member => {
        const [user] = await DiscordUser.findOrCreate({
          where: { 
            name: member,
          },
          defaults: { 
            name: member,
          },
        })

        await StaticMembers.create({
          static_id: staticId,
          member: user.name,
        })
      })
    )

    return true
  } catch (error) {
    console.error('Error creating static entry:', error)
    return false
  }
}

const ReadStatic = async (name) => {
  try {
    const staticEntry = await Static.findOne({
      where: { name },
    })
    return staticEntry || false
  } catch (error) {
    console.error('Error reading static entry:', error)
    return false
  }
}

const DeleteStatic = async (name) => {
  try {
    const staticEntry = await Static.findOne({
      where: { name },
    })

    if (!staticEntry) return false

    await StaticMembers.destroy({
      where: { 
        static_id: staticEntry.id, 
      },
    })

    await staticEntry.destroy()

    return true
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
