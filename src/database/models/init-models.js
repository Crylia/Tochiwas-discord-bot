var DataTypes = require("sequelize").DataTypes;
var _birthday = require("./birthday");
var _blacklist = require("./blacklist");
var _discorduser = require("./discorduser");
var _event = require("./event");
var _event_roles = require("./event_roles");
var _event_schedule = require("./event_schedule");
var _static = require("./static");
var _static_members = require("./static_members");


function initModels(sequelize) {
  var birthday = _birthday(sequelize, DataTypes);
  var blacklist = _blacklist(sequelize, DataTypes);
  var discorduser = _discorduser(sequelize, DataTypes);
  var event = _event(sequelize, DataTypes);
  var event_roles = _event_roles(sequelize, DataTypes);
  var event_schedule = _event_schedule(sequelize, DataTypes);
  var static = _static(sequelize, DataTypes);
  var static_members = _static_members(sequelize, DataTypes);

  discorduser.belongsToMany(static, { as: 'static_id_statics', through: static_members, foreignKey: "username", otherKey: "static_id" });
  static.belongsToMany(discorduser, { as: 'username_discordusers', through: static_members, foreignKey: "static_id", otherKey: "username" });
  birthday.belongsTo(discorduser, { as: "discorduser_discorduser", foreignKey: "discorduser" });
  discorduser.hasMany(birthday, { as: "birthdays", foreignKey: "discorduser" });
  blacklist.belongsTo(discorduser, { as: "reportedby_discorduser", foreignKey: "reportedby" });
  discorduser.hasMany(blacklist, { as: "blacklists", foreignKey: "reportedby" });
  static_members.belongsTo(discorduser, { as: "username_discorduser", foreignKey: "username" });
  discorduser.hasMany(static_members, { as: "static_members", foreignKey: "username" });
  event_roles.belongsTo(event, { as: "event", foreignKey: "event_id" });
  event.hasMany(event_roles, { as: "event_roles", foreignKey: "event_id" });
  event_schedule.belongsTo(event, { as: 'event', foreignKey: 'event_id' })
  event.hasMany(event_schedule, { as: 'event_schedules', foreignKey: 'event_id' })
  static_members.belongsTo(static, { as: "static", foreignKey: "static_id" });
  static.hasMany(static_members, { as: "static_members", foreignKey: "static_id" });

  return {
    birthday,
    blacklist,
    discorduser,
    event,
    event_roles,
    event_schedule,
    static,
    static_members,
  };
}

module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
