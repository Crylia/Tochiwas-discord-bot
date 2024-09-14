const { 
  birthday: Birthday, 
  discorduser: DiscordUser, 
} = require('./models')

const CreateBirthday = async (userName, birthdayDate) => {
  try {
    const [user, _] = await DiscordUser.findOrCreate({
      where: { name: userName },
      defaults: { name: userName },
    })

    const formattedBirthday = new Date(
      birthdayDate.split('.').reverse().join('-')
    ).toISOString().slice(0, 10)

    const birthday = await Birthday.create({
      date: formattedBirthday,
      discorduser: user.name,
    })

    return birthday !== null
  } catch (error) {
    console.error('Error creating birthday entry:', error)
    return false
  }
}

const ReadBirthday = async (userName) => {
  try {
    if (userName) {
      const user = await DiscordUser.findOne({
        where: {
          name: userName,
        },
      })
      if (user) {
        const birthdays = await Birthday.findAll({
          where: {
            discorduser: user.name,
          },
        })
        return birthdays
      } else return []
    } else {
      const birthdays = await Birthday.findAll()
      return birthdays
    }
  } catch (error) {
    console.error('Error reading birthday table:', error)
    return []
  }
}

const UpdateBirthday = async (userName, birthdayDate) => {
  try {
    const user = await DiscordUser.findOne({
      where: {
        name: userName,
      },
    })

    if (user) {
      const [updated] = await Birthday.update(
        {
          date: new Date(
            birthdayDate.split('.').reverse().join('-')
          ).toISOString().slice(0, 10),
        },
        {
          where: {
            discorduser: user.name,
          },
        }
      )
      return updated > 0
    } else return false
  } catch (error) {
    console.error('Error updating birthday table:', error)
    return false
  }
}

const DeleteBirthday = async (userName) => {
  try {
    const user = await DiscordUser.findOne({
      where: {
        name: userName,
      },
    })

    if (user) {
      const deleted = await Birthday.destroy({
        where: {
          discorduser: user.name,
        },
      })
      return deleted > 0
    } else return false
  } catch (error) {
    console.error('Error deleting birthday table:', error)
    return false
  }
}

module.exports = {
  CreateBirthday,
  ReadBirthday,
  UpdateBirthday,
  DeleteBirthday,
}
