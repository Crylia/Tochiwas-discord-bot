const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  const EventRole = sequelize.define('event_roles', {
    event_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'event',
        key: 'id'
      }
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    icon_name: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    role_id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    }
  }, {
    sequelize,
    tableName: 'event_roles',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "event_roles_pkey",
        unique: true,
        fields: [
          { name: "role_id" },
        ]
      },
    ]
  });

  EventRole.associate = function (models) {
    EventRole.belongsTo(models.event, { as: 'event', foreignKey: 'event_id' })
  }

  return EventRole
};
