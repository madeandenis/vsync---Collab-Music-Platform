import pino from 'pino';

const pinoLogger = pino(
    {
      level: 'info',
      transport: {
        targets: [
          {
            target: 'pino-pretty', 
            options: {
              colorize: true,
              translateTime: 'SYS:dd-mm-yyyy HH:MM:ss',
              ignore: 'pid,hostname',
            },
          },
          {
            target: 'pino/file', 
            options: {
              destination: 'logs/pino/app.log',
              mkdir: true, 
            },
          },
        ],
      },
    },
);

export const createLogger = (context: string, logger = pinoLogger) => {
    return logger.child({ context });
};