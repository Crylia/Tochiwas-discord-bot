const { GetIconRole } = require('../database/eventdb')
const cron = require('node-cron')

let reminderMessageID = null
let rolesMap = new Map()

const areMapsEqual = (map1, map2) => {
  if (map1.size !== map2.size) return false

  for (const [key, value] of map1)
    if (map2.get(key) !== value) return false

  return true
}

const editReactionMessage = async (client) => {
  try {
    for (const [_, oauthGuild] of await client.guilds.fetch()) {
      const guild = await oauthGuild.fetch()
      const rolesChannel = (await guild.channels.fetch()).find(ch => ch.name === 'roles')

      if (!rolesChannel) {
        console.log('Channel not found')
        return
      }
      const message = await rolesChannel.messages.fetch(reminderMessageID)

      const newRolesFromDB = await GetIconRole()

      if (areMapsEqual(rolesMap, newRolesFromDB)) {
        console.log('No changes to the roles, quitting')
        return
      }

      rolesMap = newRolesFromDB

      const currentLines = message.content.split('\n').slice(1)

      const currentRoleMap = new Map()
      currentLines.forEach(line => {
        if (!line.trim()) return
        const [icon, roleName] = line.split(': ')
        const iconName = icon.match(/<:(\w+):\d+>/)[1]
        currentRoleMap.set(iconName, roleName.replace(/`/g, ''))
      })

      const rolesToAdd = [], rolesToRemove = []

      for (const [iconName, roleName] of rolesMap)
        if (!currentRoleMap.has(iconName))
          rolesToAdd.push({ icon: iconName, name: roleName })

      for (const [iconName, roleName] of currentRoleMap)
        if (!rolesMap.has(iconName))
          rolesToRemove.push({ icon: iconName, name: roleName })

      const emojis = await guild.emojis.fetch()

      let updatedContent = 'React to get your roles!\n\n'
      rolesMap.forEach((roleName, iconName) => {
        const emoji = emojis.find(e => e.name === iconName)
        if (emoji)
          updatedContent += `${emoji}: \`${roleName}\`\n\n`
        else
          console.log(`Couldn't find emoji ${iconName}`)
      })

      await message.edit(updatedContent)

      for (const role of rolesToAdd) {
        const icon = emojis.find(e => e.name === role.icon)
        if (icon)
          await message.react(`${icon}`)
      }

      for (const role of rolesToRemove) {
        const reaction = message.reactions.cache.find(r => r.emoji.name === role.icon)
        if (!reaction) continue

        await reaction.remove()

        const roleToRemove = message.guild.roles.cache.find(r => r.name === role.name)
        if (!roleToRemove) continue

        const members = await message.guild.members.fetch()
        const membersWithRole = members.filter(member => member.roles.cache.has(roleToRemove.id))

        for (const member of membersWithRole.values())
          await member.roles.remove(roleToRemove)
      }
    }
  } catch (error) {
    console.log(error)
  }
}

const createReactionMessage = async (client) => {
  try {
    for (const [_, oauthGuild] of await client.guilds.fetch()) {
      const guild = await oauthGuild.fetch()
      const rolesChannel = (await guild.channels.fetch()).find(ch => ch.name === 'roles')

      if (!rolesChannel) {
        console.log('Channel not found')
        return
      }

      const fetchedMessage = await rolesChannel.messages.fetch({ limit: 1 })
      if (fetchedMessage.size > 0) {
        reminderMessageID = fetchedMessage.first().id
        console.log('Reminder MessageID: ', reminderMessageID)
        return
      }

      const emojis = await guild.emojis.fetch()

      let message = 'React to get your roles!\n\n'
      for (const [iconName, roleName] of rolesMap) {
        const emoji = emojis.find(e => e.name === iconName)
        if (emoji)
          message += `<:${emoji.name}:${emoji.id}> : \`${roleName}\`\n\n`
        else
          console.log(`Emoji for ${iconName} not found`)
      }
      const sentMessage = await rolesChannel.send(message)

      for (const [iconName, _] of rolesMap) {
        const emoji = emojis.find(e => e.name === iconName)
        if (emoji) await sentMessage.react(emoji.id)
      }

      reminderMessageID = sentMessage.id
    }
  } catch (error) {
    console.log(error)
  }
}

const messageReactionAdd = async (user, reaction) => {
  if (user.id === '1280557738530963506') return

  const { message, emoji } = reaction
  const guild = message.guild
  const member = await guild.members.fetch(user.id)
  if (!member) return

  if (message.id === reminderMessageID) {
    const roleMap = await GetIconRole()

    const roleName = roleMap.get(emoji.name)
    if (roleName) {
      try {
        const roles = await guild.roles.fetch()
        const role = roles.find(r => r.name === roleName)

        if (role && !member.roles.cache.has(role.id))
          await member.roles.add(role)

      } catch (error) {
        console.error(`Error fetching role for ${roleName}`, error)
      }
    }
  }
}

const messageReactionRemove = async (user, reaction) => {
  const { message, emoji } = reaction
  const guild = message.guild

  const member = await guild.members.fetch(user.id)
  if (!member) return

  if (message.id === reminderMessageID) {
    const roleMap = await GetIconRole()

    const roleName = roleMap.get(emoji.name)
    if (roleName) {
      try {
        const roles = await guild.roles.fetch()
        const role = roles.find(r => r.name === roleName)

        if (role && member.roles.cache.has(role.id))
          await member.roles.remove(role)

      } catch (error) {
        console.error(`Error fetching role for ${roleName}`, error)
      }
    }
  }
}

const initReactionPerRole = async (client) => {
  rolesMap = await GetIconRole()

  await createReactionMessage(client)

  cron.schedule('0 * * * *', async () => {
    await editReactionMessage(client)
  })
}

module.exports = {
  initReactionPerRole,
  messageReactionAdd,
  messageReactionRemove,
}
