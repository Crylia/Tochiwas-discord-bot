const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('static', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(12),
      allowNull: false,
      unique: "unique_name"
    },
    creator: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: true // or false depending on your requirements
    },
    text_channel_id: {
      type: DataTypes.STRING, // or INTEGER if IDs are numeric
      allowNull: true // or false depending on your requirements
    },
    voice_channel_id: {
      type: DataTypes.STRING, // or INTEGER if IDs are numeric
      allowNull: true // or false depending on your requirements
    }
  }, {
    sequelize,
    tableName: 'static',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "static_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "unique_name",
        unique: true,
        fields: [
          { name: "name" },
        ]
      },
    ]
  });
};
