const { AttachmentBuilder } = require('discord.js')

async function showRoleMembers(interaction) {
	const role = interaction.options.getRole('role')

	if (!role || !interaction.guild) {
		if (!interaction.deferred && !interaction.replied) {
			return interaction.reply({ content: 'Invalid role or guild.', ephemeral: true })
		} else {
			return interaction.editReply({ content: 'Invalid role or guild.' })
		}
	}

	console.time('showRoleMembers.defer')

	try {
		await interaction.deferReply({ ephemeral: true })
		console.timeLog('showRoleMembers.defer', '→ deferred')
	} catch (deferErr) {
		console.error('❌ Failed to defer reply:', deferErr)
		return
	}

	try {
		await interaction.guild.members.fetch()

		const membersWithRole = interaction.guild.members.cache
			.filter(member => member.roles.cache.has(role.id))
			.map(member => member.displayName)
			.sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }))

		if (membersWithRole.length === 0) {
			return interaction.editReply(`No users found with the role **${role.name}**.`)
		}

		const output = `Users with role **${role.name}**:\n${membersWithRole.join('\n')}`

		if (output.length > 2000) {
			const buffer = Buffer.from(membersWithRole.join('\n'), 'utf-8')
			const file = new AttachmentBuilder(buffer, { name: `${role.name}_members.txt` })

			return interaction.editReply({
				content: `Too many users to list in a message. See the attached file:`,
				files: [file],
			})
		}

		return interaction.editReply(output)
	} catch (err) {
		console.error('❌ Error in showRoleMembers logic:', err)

		try {
			if (interaction.deferred || interaction.replied) {
				return interaction.editReply({
					content: 'Something went wrong while showing role members.',
				})
			} else {
				return interaction.reply({
					content: 'Something went wrong before replying to Discord.',
					ephemeral: true,
				})
			}
		} catch (replyErr) {
			console.error('❌ Failed to send fallback error message:', replyErr)
		}
	}
}

module.exports = { showRoleMembers }
