# Tochi's Discord Bot

A simple discord bot for the Limited Edition guild in the game Aion Classic that interfaces with a PostgreSQL database

The bot is made to run on a single server and will thus share the same database

Its best to run the bot in a docker container

## Features

- Birthday
  - Set/Remove/Update/Check your birthday
  - Everyone gets notified when the day arrives
- Blacklist
  - Blacklist a player with a given reason
  - Updates a global message
  - Can check against individual players
- Event Reminder
  - Reminds roles for ingame events 15min ahead of time
- Role assignment
  - Assign your role by reacting to a message

## TODO

- Write tests
  - Mirror production DB to test DB on start
  - Figure out how to test discord function (probably fake the data)
  - How to validate correct cronjob time? Fake system time?
- Static
  - Command to create new static with name, size, members
    - Allow CRUD of members
    - Give the members the corresponding role
  - Create new test and voice channel that only member and admins can see
    - Channels should mirror the name of the static
  - Reminder for the statics with custom remind times (e.g. 1h early)
  - Command that asks every user to confirm a set date and time for the static
    - Make it always repeat on the same time, or just once (have to re create every time)
  - Write easy to understand documentation and a HOWTO
