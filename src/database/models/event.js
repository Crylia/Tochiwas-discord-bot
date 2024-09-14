const Sequelize = require('sequelize')
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('event', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: 'event_name_key',
    },
  }, {
    sequelize,
    tableName: 'event',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: 'event_name_key',
        unique: true,
        fields: [
          { name: 'name' },
        ],
      },
      {
        name: 'event_pkey',
        unique: true,
        fields: [
          { name: 'id' },
        ],
      },
    ],
  })
}
