const {
  event_schedule: EventSchedule,
  event_roles: EventRoles,
  event: Event,
} = require('./models')

const ReadEvents = async () => {
  try {
    const events = await EventSchedule.findAll({
      include: [{
        model: Event,
        as: 'event'
      }]
    })

    const eventsMap = events.map(event => ({
      schedule_id: event.id,
      event_name: event.event.name,
      start_time: event.start_time,
      end_time: event.end_time,
      day_of_week: event.day_of_week
    }))

    return eventsMap
  } catch (error) {
    console.error('Error reading event entries:', error)
    return false
  }
}


const GetEventRole = async () => {
  try {
    const eventRoles = await EventRoles.findAll({
      include: [{
        model: Event,
        as: 'event'
      }],
      attributes: [
        'role', 'event.name'
      ]
    })
    const rolesEventMap = new Map()

    eventRoles.forEach(row => {
      if (!row.event) return
      rolesEventMap.set(row.event.name, row.role)
    })

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

const CreateEventSchedule = async (eventName, dayOfWeek, startTime, endTime) => {
  try {
    const [eventEntry] = await Event.findOrCreate({
      where: { name: eventName },
      defaults: { name: eventName }
    })

    const scheduleEntry = await EventSchedule.create({
      event_id: eventEntry.id,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime
    })

    return scheduleEntry
  } catch (error) {
    console.error('Error creating event schedule:', error)
    return false
  }
}

const DeleteEventSchedule = async (scheduleId) => {
  try {
    const rowsDeleted = await EventSchedule.destroy({
      where: { id: scheduleId }
    })
    return rowsDeleted > 0
  } catch (error) {
    console.error('Error deleting event schedule:', error)
    return false
  }
}

module.exports = {
  ReadEvents,
  GetEventRole,
  GetIconRole,
  CreateEventSchedule,
  DeleteEventSchedule,
}
