const { CreateStatic, ReadStatic, DeleteStatic } = require('../database/staticdb')

const handleStaticAdd = async (name, creator, members, size, role_id, text_channel_id, voice_channel_id) => {
  if (!name || !creator || !role_id || !text_channel_id || !voice_channel_id) return false

  const result = await CreateStatic(
    name, creator, members, size, role_id, text_channel_id, voice_channel_id
  )

  return result
}

const handleStaticGet = async (name) => {
  if (!name) return false

  const result = await ReadStatic(name)

  return result
}

const handleStaticDelete = async (name) => {
  if (!name) return false

  const result = await DeleteStatic(name)

  return result
}

const handleStaticUpdateName = async (newName) => {

}
const handleStaticUpdateUser = async (user, action) => {

}
const handleStaticUpdateUsers = async (users, action) => {

}
const handleStaticUpdateSize = async (newSize) => {

}

module.exports = {
  handleStaticAdd,
  handleStaticGet,
  handleStaticDelete,
  handleStaticUpdateName,
  handleStaticUpdateUser,
  handleStaticUpdateUsers,
  handleStaticUpdateSize
}
