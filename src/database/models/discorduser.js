const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('discorduser', {
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      primaryKey: true
    }
  }, {
    sequelize,
    tableName: 'discorduser',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "discorduser_pkey",
        unique: true,
        fields: [
          { name: "name" },
        ]
      },
    ]
  });
};
