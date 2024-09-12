const { client } = require('./database')

const ReadEvents = async () => {
  try {
    const res = await client.query(`
			SELECT * FROM event_times;`
    )
    return res.rows
  } catch (error) {
    console.error('Error reading event entries:', error)
    return false
  }
}

const GetEventRole = async () => {
  try {
    const res = await client.query(`
      SELECT * FROM event_role_view;`
    )
    const rolesEventMap = new Map()
    res.rows.forEach(row => rolesEventMap.set(row.event_name, row.role))

    return rolesEventMap
  } catch (error) {
    console.error(error)
    return false
  }
}

const GetIconRole = async () => {
  try {
    const res = await client.query(`
      SELECT role, icon_name FROM event_roles;`
    )
    const rolesEventMap = new Map()
    res.rows.forEach(row => rolesEventMap.set(row.icon_name, row.role))

    return rolesEventMap
  } catch (error) {
    console.error(error)
    return false
  }
}

module.exports = {
  ReadEvents,
  GetEventRole,
  GetIconRole,
}
