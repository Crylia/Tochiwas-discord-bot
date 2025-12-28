const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  const StaticMembers = sequelize.define('static_members', {
    static_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'static',
        key: 'id'
      }
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'discorduser',
        key: 'name'
      }
    }
  }, {
    sequelize,
    tableName: 'static_members',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "static_members_pkey",
        unique: true,
        fields: [
          { name: "static_id" },
          { name: "username" },
        ]
      },
    ]
  });

  StaticMembers.associate = function (models) {
    StaticMembers.belongsTo(models.static, { as: 'static', foreignKey: 'static_id' });
    StaticMembers.belongsTo(models.discorduser, { as: 'user', foreignKey: 'username' });
  };

  return StaticMembers;
};
