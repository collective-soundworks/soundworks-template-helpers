import fs from 'node:fs';
import path from 'node:path';

import JSON5 from 'json5';

const ENV = process.env.ENV || 'default';

let env = null;
let app = null;

console.log('');
// parse env config
const envConfigFilename = path.join('config', 'env', `${ENV}.json`);
console.log(`> reading "${envConfigFilename}"`);

try {
  env = JSON5.parse(fs.readFileSync(envConfigFilename, 'utf-8'));

  if (process.env.PORT) {
    env.port = process.env.PORT;
  }
} catch(err) {
  console.log(`Invalid "${ENV}" env config file: ${envConfigFilename}`);
  process.exit(1);
}

// parse app config
const appConfigFilename = path.join('config', 'application.json');
console.log(`> reading "${appConfigFilename}"`);

try {
  app = JSON5.parse(fs.readFileSync(appConfigFilename, 'utf-8'));
} catch(err) {
  console.log(`Invalid app config file: ${appConfigFilename}`);
  process.exit(1);
}

export default { env, app };
