const { spawn } = require('child_process');

const child = spawn('npx', ['drizzle-kit', 'push', '--force'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';

child.stdout.on('data', (data) => {
  const text = data.toString();
  output += text;
  process.stdout.write(text);
  
  // Auto-respond to prompts by pressing Enter (selecting first option)
  if (text.includes('Is') && text.includes('table created or renamed')) {
    console.log('\n→ Auto-selecting: create table');
    child.stdin.write('\n');
  }
});

child.stderr.on('data', (data) => {
  process.stderr.write(data);
});

child.on('close', (code) => {
  console.log(`\nProcess exited with code ${code}`);
});