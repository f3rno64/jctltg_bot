const _isString = require('lodash/isString')
const _isEmpty = require('lodash/isEmpty')

const { ADMIN_CHAT_ID, USER_CHAT_IDS } = process.env

const adminChatID = +ADMIN_CHAT_ID
const userChatIDs = _isString(USER_CHAT_IDS) && !_isEmpty(USER_CHAT_IDS)
  ? `${USER_CHAT_IDS}`.split(',').map(c => +c)
  : []

module.exports = {
  init: (bot) => {
    bot.adminChatID = adminChatID
    bot.userChatIDs = [adminChatID, ...userChatIDs]
    bot.userTZOffsets = {}
    bot.canSub = false

    bot.offsetTimeForSub = (time, subID) => {
      const offset = bot.userTZOffsets[subID]

      if (isNaN(offset)) return time

      return time + (1000 * 60 * 60 * offset)
    }

    bot.subHasTZOffset = (subID) => {
      return !isNaN(bot.userTZOffsets[subID])
    }

    bot.messageAdmin = (msg) => {
      bot.b.sendMessage(bot.adminChatID, msg)
    }

    bot.messageUsers = (msg) => {
      for (let i = 0; i < bot.userChatIDs.length; i += 1) {
        bot.b.sendMessage(bot.userChatIDs[i], msg)
      }
    }
  },

  commands: {
    '/sub': {
      desc: 'subscribe for updates',
      handler: (bot, msg, reply) => {
        if (bot.canSub === false) {
          return reply('subscriptions are disabled :(')
        }

        if (bot.userChatIDs.indexOf(msg.chat.id) !== -1) {
          return reply("you're already on the list mate")
        }

        bot.userChatIDs.push(msg.chat.id)

        return reply('success!')
      }
    },

    '/set-tz-offset': {
      desc: 'update your timezone offset, in hours',
      handler: (bot, msg, reply) => {
        const subID = msg.chat.id

        if (bot.userChatIDs.indexOf(subID) === -1) {
          return reply('you are not a subscriber bro')
        }

        const offset = Number(msg.text.substring('/set-tz-offset'.length).trim())

        if (isNaN(offset)) {
          return reply('invalid offset')
        }

        bot.userTZOffsets[subID] = offset

        return reply(`ok, your offset is now ${offset}h`)
      }
    },

    '/get-tz-offset': {
      desc: 'read your timezone offset',
      handler: (bot, msg, reply) => {
        const subID = msg.chat.id

        if (bot.userChatIDs.indexOf(subID) === -1) {
          return reply('you are not a subscriber bro')
        }

        if (!bot.userTZOffsets[subID]) {
          bot.userTZOffsets[subID] = 0
        }

        return reply(`your TZ offset is ${bot.userTZOffsets[subID]}h`)
      }
    }
  }
}
