import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import chalk from 'chalk';

let _bootstrap = null;
let _children = new Map();

export default {
  async execute(bootstrap, {
    numClients = 1,
    sourceURL = null,
  } = {}) {
    _bootstrap = bootstrap;

    if (Number.isInteger(numClients)) {
      if (numClients > 1 && sourceURL === null) {
        throw new Error('Cannot emulate several clients, `source` option must be defined');
      }

      if (numClients > 1) {
        // @todo - use fork instead of threads, we don't want to share anything here
        if (process.argv[2] === 'child') {
          bootstrap();
        } else {
          for (let i = 0; i < numClients; i++) {
            const child = fork(fileURLToPath(sourceURL), ['child'], {});
            _children.set(child.pid, { child });
          }
        }
      } else {
        bootstrap();
      }
    }
  },

  async register(client, {
    restartOnError = true,
  } = {}) {
    const { useHttps, serverIp, port } = client.config.env;
    const url = `${useHttps ? 'https' : 'http'}://${serverIp}:${port}`;
    // @todo - change serverIp to address
    console.log(chalk.cyan(`[client ${client.type}] connecting to ${url}`));

    async function exitHandler(err) {
      console.log(chalk.cyan(`[client ${client.type} ${client.id}] closing due to error...`));

      if (err && err.message) {
        console.error(chalk.red(`> ${err.type} ${err.message}`));
      } else {
        console.error(chalk.red(`> ${err}`));
      }

      // stop will trigger the socket close message so we don't want to trigger
      // restart twice
      try {
        process.removeAllListeners('uncaughtException');
        process.removeAllListeners('unhandledRejection');

        client.socket.removeAllListeners('close');
        client.socket.removeAllListeners('error');

        await client.stop();

        if (restartOnError) {
          console.log(chalk.cyan(`[client ${client.type}] restarting...`));
          _bootstrap();
        }
      } catch(err) {
        console.error(chalk.red('> err in exitHandler'));
        console.error(err);
        process.exit(1);
        // do nothing client is already stopping...
      }
    }

    client.socket.addListener('close', () => exitHandler('socket closed'));
    client.socket.addListener('error', () => exitHandler('socket errored'));

    process.addListener('uncaughtException', err => exitHandler(err));
    process.addListener('unhandledRejection', err => exitHandler(err));
  },
};
