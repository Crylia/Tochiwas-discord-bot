const { CreateStatic, ReadStatic, DeleteStatic } = require('../database/staticdb')

const handleStaticAdd = async (name, creator, members, size) => {
  if (!name || !createor || !members || !size) return false

  const result = await CreateStatic(name, creator, members, size)

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

module.exports = {
  handleStaticAdd,
  handleStaticGet,
  handleStaticDelete,
}
