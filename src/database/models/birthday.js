const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('birthday', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    discorduser: {
      type: DataTypes.STRING(100),
      allowNull: false,
      references: {
        model: 'discorduser',
        key: 'name'
      }
    }
  }, {
    sequelize,
    tableName: 'birthday',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "birthday_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
