const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('blacklist', {
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      primaryKey: true
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    reportedby: {
      type: DataTypes.STRING(100),
      allowNull: true,
      references: {
        model: 'discorduser',
        key: 'name'
      }
    }
  }, {
    sequelize,
    tableName: 'blacklist',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "blacklist_pkey",
        unique: true,
        fields: [
          { name: "name" },
        ]
      },
    ]
  });
};
