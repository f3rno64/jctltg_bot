const TGBot = require('tgfancy')
const Immutable = require('immutable')
const debug = require('debug')('jctltg-bot:telegram')

const UserCommands = require('./commands/users')
const { TG_BOT_TOKEN } = process.env

const BOT_COMMAND_SETS = [UserCommands]

module.exports = class Bot {
  constructor () {
    this.b = new TGBot(TG_BOT_TOKEN, {
      polling: true,

      tgfancy: {
        chatIdResolution: true
      }
    })

    this.commands = {}
    this.data = Immutable.Map()

    for (let i = 0; i < BOT_COMMAND_SETS.length; i += 1) {
      const set = BOT_COMMAND_SETS[i]

      if (set.init) set.init(this)

      const setCommands = Object.keys(set.commands)

      for (let j = 0; j < setCommands.length; j += 1) {
        this.commands[setCommands[j]] = set.commands[setCommands[j]]
      }
    }

    this.b.on('message', this.onMessage.bind(this))
  }

  /**
   * To discourage direct updates of the data key + provide persistence
   *
   * @param {Map} newData immutable
   * @return {Map} newData
   */
  updateData (newData) {
    this.data = newData

    // TODO: Save to redis
  }

  // TODO: Switch to regexes
  onMessage (msg) {
    const chatID = msg.chat.id
    const reply = (resText) => {
      debug(`reply [${chatID}]: ${resText}`)

      return this.b.sendMessage(chatID, resText)
    }

    debug(`recv [${chatID}]: ${msg.text}`)

    if (msg.text.indexOf('/help') === 0) {
      return this.onHelpCommand(msg, reply)
    }

    const knownCommands = Object.keys(this.commands)

    for (let i = 0; i < knownCommands.length; i += 1) {
      if (msg.text.indexOf(knownCommands[i]) === 0) {
        return this.commands[knownCommands[i]].handler(this, msg, reply)
      }
    }

    return this.onUnknownCommand(msg, reply)
  }

  onUnknownCommand (msg, reply) {
    return reply('unknown command')
  }

  onHelpCommand (msg, reply) {
    let output = ''

    const knownCommands = Object.keys(this.commands)

    for (let i = 0; i < knownCommands.length; i += 1) {
      const cmd = knownCommands[i]
      const cmdData = this.commands[cmd]

      if (cmdData.desc) {
        output += `  ${cmd}: ${cmdData.desc}\n`

        if (cmdData.examples) {
          for (let j = 0; j < cmdData.examples.length; j += 1) {
            output += `    i.e. ${cmdData.examples[j]}\n`
          }
        }
      }
    }

    return reply(output.length > 0
      ? `Available commands:\n\n${output}`
      : 'no help available'
    )
  }
}
