const Sequelize = require('sequelize');

module.exports = function (sequelize, DataTypes) {
  const EventSchedule = sequelize.define('event_schedule', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    event_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'event',
        key: 'id'
      }
    },
    day_of_week: {
      type: DataTypes.STRING(9),
      allowNull: true
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'event_schedule',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: 'event_schedule_pkey',
        unique: true,
        fields: [{ name: 'id' }]
      }
    ]
  });

  EventSchedule.associate = function (models) {
    EventSchedule.belongsTo(models.event, { as: 'event', foreignKey: 'event_id' });
  };

  return EventSchedule;
};
