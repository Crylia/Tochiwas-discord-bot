const {
  CreateStatic,
  ReadStatic,
  DeleteStatic,
  AddStaticMember,
  RemoveStaticMember,
  UpdateStaticSize,
  GetStaticMembers
} = require('../database/staticdb')

const handleStaticAdd = async (name, creator, members, size, role_id, text_channel_id, voice_channel_id) => {
  if (!name || !creator || !role_id || !text_channel_id || !voice_channel_id) return false

  const result = await CreateStatic(
    name, creator, members, size, role_id, text_channel_id, voice_channel_id
  )

  return result
}

const handleStaticGet = async (name) => {
  if (!name) return false
  const staticData = await ReadStatic(name)
  if (!staticData) return false

  const members = await GetStaticMembers(name)
  return { ...staticData.toJSON(), members }
}

const handleStaticDelete = async (name) => {
  if (!name) return false

  const result = await DeleteStatic(name)

  return result
}

const handleStaticUpdateName = async (newName) => {

}
const handleStaticUpdateUsers = async (users, action) => {

}

const handleStaticUpdateUser = async (name, user, action) => {
  if (!name || !user) return 'error'

  if (action === 'add') {
    const staticData = await ReadStatic(name)
    if (!staticData) return 'not_found'

    const currentMembers = await GetStaticMembers(name)

    if (currentMembers.includes(user)) {
      return 'already_joined'
    }

    if (currentMembers.length >= staticData.size) {
      return 'full'
    }

    const result = await AddStaticMember(name, user)
    return result ? 'success' : 'error'

  } else if (action === 'remove') {
    const result = await RemoveStaticMember(name, user)
    return result ? 'success' : 'error'
  }
  return 'error'
}

const handleStaticUpdateSize = async (name, newSize) => {
  if (!name || !newSize) return false
  return await UpdateStaticSize(name, newSize)
}

module.exports = {
  handleStaticAdd,
  handleStaticGet,
  handleStaticDelete,
  handleStaticUpdateUser,
  handleStaticUpdateSize
}
