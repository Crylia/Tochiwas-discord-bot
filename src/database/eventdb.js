const { 
  event_schedule: EventTimes, 
  event_role_view: EventRoleView, 
  event_roles: EventRoles, 
} = require('./models')

const ReadEvents = async () => {
  try {
    const events = await EventTimes.findAll()
    return events
  } catch (error) {
    console.error('Error reading event entries:', error)
    return false
  }
}

const GetEventRole = async () => {
  try {
    const eventRoles = await EventRoleView.findAll()
    const rolesEventMap = new Map()

    eventRoles.forEach(row => rolesEventMap.set(row.event_name, row.role))

    return rolesEventMap
  } catch (error) {
    console.error('Error fetching event roles:', error)
    return false
  }
}

const GetIconRole = async () => {
  try {
    const eventIcons = await EventRoles.findAll({
      attributes: ['role', 'icon_name'],
    })
    const rolesIconMap = new Map()

    eventIcons.forEach(row => rolesIconMap.set(row.icon_name, row.role))

    return rolesIconMap
  } catch (error) {
    console.error('Error fetching icon roles:', error)
    return false
  }
}

module.exports = {
  ReadEvents,
  GetEventRole,
  GetIconRole,
}
