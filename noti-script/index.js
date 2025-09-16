// noti-script/index.js  (CommonJS)
require('dotenv').config({ path: '../.env.local' });
const cron = require('node-cron');
const { spawn } = require('child_process');

let running = false;

function runOnce() {
  if (running) return;      // tránh chồng lệnh nếu lần trước chưa xong
  running = true;

  const p = spawn(process.execPath, ['send-appointment-noti.js'], {
    cwd: __dirname,
    stdio: 'inherit'
  });

  p.on('close', () => { running = false; });
  p.on('error', () => { running = false; });
}

// chạy ngay 1 lần lúc khởi động
runOnce();

// chạy lặp mỗi 10 giây
cron.schedule('*/30 * * * * *', runOnce);
//cron.schedule('0 * * * * *', runOnce);

console.log('🚀 Notification runner started (every 30s)');