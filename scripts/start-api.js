const { spawn } = require('child_process');
const path = require('path');

const cwd = path.join(__dirname, '..', 'services', 'api-gateway');

const child = spawn(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['ts-node', 'src/index.ts'],
  {
    cwd,
    stdio: 'inherit',
    shell: true,
  }
);

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
