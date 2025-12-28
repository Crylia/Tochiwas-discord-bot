const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  const Static = sequelize.define('static', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
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
      type: DataTypes.STRING,
      allowNull: true
    },
    text_channel_id: {
      type: DataTypes.STRING,
      allowNull: true
    },
    voice_channel_id: {
      type: DataTypes.STRING,
      allowNull: true
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

  Static.associate = function (models) {
    Static.hasMany(models.static_members, { as: 'static_members', foreignKey: 'static_id' });
  };

  return Static;
};
