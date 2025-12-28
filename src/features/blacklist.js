const { CreateBlacklist, ReadBlacklist, UpdateBlacklist, DeleteBlacklist } = require('../database/blacklistdb')
const { EmbedBuilder } = require('discord.js')

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

const createBlacklistEmbeds = (playerEntries, maxChars = 30) => {
  const embeds = []
  let embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('Blacklist (Page 1)')
    .setDescription('Players who have been blacklisted and the reasons.')

  let fieldCount = 0
  let pageIndex = 1

  playerEntries.sort((a, b) => a[0].localeCompare(b[0]))

  playerEntries.forEach(([playerName, reason]) => {
    let splitReason = []
    while (reason.length > maxChars) {
      let splitIndex = reason.lastIndexOf(' ', maxChars)
      if (splitIndex === -1) splitIndex = maxChars
      splitReason.push(reason.substring(0, splitIndex))
      reason = reason.substring(splitIndex + 1)
    }
    splitReason.push(reason)

    const nameField = playerName || '\u200B'
    const valueField = splitReason.join('\n').trim() || '\u200B'

    if (valueField !== '\u200B') {
      embed.addFields({ name: nameField, value: valueField, inline: true })
      fieldCount++
    }

    if (fieldCount >= 25) {
      embeds.push(embed)
      pageIndex++
      embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`Blacklist (Page ${pageIndex})`)
        .setDescription('Players who have been blacklisted and the reasons.')
      fieldCount = 0
    }
  })

  if (fieldCount > 0) {
    embeds.push(embed)
  }
  return embeds
}

const updateGlobalMessage = async (client) => {
  try {
    const targetChannel = await client.channels.fetch('1272953247912558704')

    if (!targetChannel) {
      console.error('Channel with id 1272953247912558704 not found.')
      return
    }

    const embeds = createBlacklistEmbeds(
      (await handleBlacklistShow()).map(
        entry => [entry.name, entry.reason]
      )
    )

    // The message count will increase/decrese with a maximum of 1, so pulling the new page
    // count + 1 will guarantee that all previous embeds will be deleted
    const messages = await targetChannel.messages.fetch({ limit: embeds.length + 1 })
    await Promise.all(messages.map(msg => msg.delete()))

    for (const embed of embeds)
      await targetChannel.send({ embeds: [embed] })

  } catch (error) {
    console.error('Error updating global message:', error)
  }
}

module.exports = {
  handleBlacklistAdd,
  handleBlacklistCheck,
  handleBlacklistShow,
  updateGlobalMessage,
}
