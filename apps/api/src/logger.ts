import winston from 'winston'

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
}

winston.addColors(colors)

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => {
      const meta = Object.keys(info)
        .filter((k) => !['timestamp', 'level', 'message', 'splat'].includes(k))
        .reduce((obj: Record<string, unknown>, key) => {
          obj[key] = info[key as keyof typeof info]
          return obj
        }, {})
      const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : ''
      return `${info.timestamp} ${info.level}: ${info.message}${metaStr}`
    },
  ),
)

const transports = [
  // Console transport
  new winston.transports.Console(),

  // File transport for errors
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
      winston.format.printf(
        (info) => {
          const meta = Object.keys(info)
            .filter((k) => !['timestamp', 'level', 'message', 'splat'].includes(k))
            .reduce((obj: Record<string, unknown>, key) => {
              obj[key] = info[key as keyof typeof info]
              return obj
            }, {})
          const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : ''
          return `${info.timestamp} ${info.level}: ${info.message}${metaStr}`
        },
      ),
    ),
  }),

  // File transport for all logs
  new winston.transports.File({
    filename: 'logs/all.log',
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
      winston.format.printf(
        (info) => {
          const meta = Object.keys(info)
            .filter((k) => !['timestamp', 'level', 'message', 'splat'].includes(k))
            .reduce((obj: Record<string, unknown>, key) => {
              obj[key] = info[key as keyof typeof info]
              return obj
            }, {})
          const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : ''
          return `${info.timestamp} ${info.level}: ${info.message}${metaStr}`
        },
      ),
    ),
  }),
]

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'debug',
  levels,
  format,
  transports,
})

export default logger
