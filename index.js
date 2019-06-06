process.env.DEBUG = '*,-node-telegram-bot-api'

require('dotenv').config()

const JournalCTL = require('journalctl')
const debug = require('debug')('jctltg-bot:main')

const TGBot = require('./lib/telegram')
const { ONLY_FRESH, WATCH_UNITS } = process.env
const NOW = Date.now()

debug('started at %s', NOW)

const bot = new TGBot()
bot.messageAdmin(`started up @ ${new Date().toLocaleString()}`)

const units = WATCH_UNITS.split(',')

units.forEach(unit => {
  debug('watching unit %s', unit)

  const jctl = new JournalCTL({ unit })

  jctl.on('event', e => {
    const {
      MESSAGE, _HOSTNAME, _SOURCE_REALTIME_TIMESTAMP, __REALTIME_TIMESTAMP,
      UNIT, _SYSTEMD_UNIT
    } = e

    const unitLabel = UNIT || _SYSTEMD_UNIT
    const mts = +(_SOURCE_REALTIME_TIMESTAMP || __REALTIME_TIMESTAMP) / 1000
    const msg = `[${_HOSTNAME} | ${unitLabel} | ${new Date(mts).toLocaleString()} ${MESSAGE}`

    if (ONLY_FRESH && mts < NOW) {
      debug('ignoring old message: %s', msg)
      return
    }

    debug('%s', msg)
    bot.messageAdmin(msg)
  })
})
