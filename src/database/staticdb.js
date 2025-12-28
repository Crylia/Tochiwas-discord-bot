const {
  static: Static,
  static_members: StaticMembers,
  discorduser: DiscordUser,
} = require('./models')

const CreateStatic = async (name, creator, members, size, role_id, text_channel_id, voice_channel_id) => {
  try {
    console.log(role_id, text_channel_id, voice_channel_id)

    const staticEntry = await Static.create({
      name,
      creator,
      size,
      role_id,
      text_channel_id,
      voice_channel_id,
    })

    const staticId = staticEntry.id

    await Promise.all(
      members.map(async member => {
        if (!member.username) return;
        const [user] = await DiscordUser.findOrCreate({
          where: {
            name: member.username,
          },
          defaults: {
            name: member.username,
          },
        })

        await StaticMembers.create({
          static_id: staticId,
          username: user.name,
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
const AddStaticMember = async (staticName, username) => {
  try {
    const staticEntry = await Static.findOne({ where: { name: staticName } })
    if (!staticEntry) return false

    const [user] = await DiscordUser.findOrCreate({
      where: { name: username },
      defaults: { name: username },
    })

    await StaticMembers.findOrCreate({
      where: {
        static_id: staticEntry.id,
        username: user.name,
      },
    })
    return true
  } catch (error) {
    console.error('Error adding static member:', error)
    return false
  }
}

const RemoveStaticMember = async (staticName, username) => {
  try {
    const staticEntry = await Static.findOne({ where: { name: staticName } })
    if (!staticEntry) return false

    const deleted = await StaticMembers.destroy({
      where: {
        static_id: staticEntry.id,
        username: username,
      },
    })
    return deleted > 0
  } catch (error) {
    console.error('Error removing static member:', error)
    return false
  }
}

const UpdateStaticSize = async (staticName, size) => {
  try {
    const [updated] = await Static.update({ size }, { where: { name: staticName } })
    return updated > 0
  } catch (error) {
    console.error('Error updating static size:', error)
    return false
  }
}

const GetStaticMembers = async (staticName) => {
  try {
    const staticEntry = await Static.findOne({
      where: { name: staticName },
      include: [{
        model: StaticMembers,
        as: 'static_members'
      }]
    })
    if (!staticEntry) return []
    return staticEntry.static_members.map(sm => sm.username)
  } catch (error) {
    console.error('Error fetching static members:', error)
    return []
  }
}

module.exports = {
  CreateStatic,
  ReadStatic,
  DeleteStatic,
  AddStaticMember,
  RemoveStaticMember,
  UpdateStaticSize,
  GetStaticMembers
}
