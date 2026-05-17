const { spawn } = require('child_process');
const path = require('path');

const cwd = path.join(__dirname, '..', 'apps', 'web');

const child = spawn(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['next', 'dev', '-p', '3001'],
  {
    cwd,
    stdio: 'inherit',
    shell: true,
  }
);

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
