const { AttachmentBuilder } = require('discord.js')

async function showRoleMembers(interaction) {
	const role = interaction.options.getRole('role')

	if (!role || !interaction.guild) {
		return interaction.reply({ content: 'Invalid role or guild.', ephemeral: true })
	}

	await interaction.deferReply({ ephemeral: true })

	// Fetch all guild members (may require enabling GUILD_MEMBERS intent)
	await interaction.guild.members.fetch()

	const membersWithRole = interaction.guild.members.cache
		.filter(member => member.roles.cache.has(role.id))
		.map(member => member.user.tag)

	if (membersWithRole.length === 0) {
		return interaction.editReply(`No users found with the role **${role.name}**.`)
	}

	const MAX_LENGTH = 2000
	let output = `Users with role **${role.name}**:\n` + membersWithRole.join('\n')

	if (output.length > MAX_LENGTH) {
		const buffer = Buffer.from(membersWithRole.join('\n'))
		const file = new AttachmentBuilder(buffer, { name: `${role.name}_members.txt` })
		return interaction.editReply({ content: `Too many users. See the attached file.`, files: [file] })
	}

	return interaction.editReply(output)
}

module.exports = { showRoleMembers }
