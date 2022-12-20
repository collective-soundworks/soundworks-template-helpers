import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import chalk from 'chalk';

let _bootstrap = null;

function forkRestartableProcess(modulePath) {
  const child = fork(modulePath, ['child'], {});
  child.on('exit', () => forkRestartableProcess(modulePath));
}

export default {
  async execute(bootstrap, {
    numClients = 1,
    moduleURL = null,
  } = {}) {
    _bootstrap = bootstrap;

    if (!Number.isInteger(numClients)) {
      throw new Error('[launcher] `numClients` options is mandatory and should be an integer');
    }

    if (moduleURL === null) {
      throw new Error('[launcher] `moduleURL` option is mandatory');
    }

    if (process.argv[2] === 'child') {
      bootstrap();
    } else {
      for (let i = 0; i < numClients; i++) {
        forkRestartableProcess(fileURLToPath(moduleURL));
      }
    }
  },

  async register(client, {
    restartOnError = true,
  } = {}) {
    const { useHttps, serverAddress, port } = client.config.env;
    const url = `${useHttps ? 'https' : 'http'}://${serverAddress}:${port}`;

    console.log(chalk.cyan(`[launcher][client ${client.role}] connecting to ${url}`));

    async function exitHandler(err) {
      console.log(chalk.cyan(`[launcher][client ${client.role} ${client.id}] closing due to error...`));

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
          console.log(chalk.cyan(`[launcher][client ${client.role} ${client.id}] exiting process...`));
          process.exit();
        }
      } catch(err) {
        console.error(chalk.red('> error in exitHandler'));
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
