// 本地完整启动验证：embedded-postgres + 真实应用进程，验证能 listen 并返回首页。
import EmbeddedPostgres from 'embedded-postgres';
import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';

const PORT = 3999;
const dataDir = process.env.TEMP + '/epg-start-data';
rmSync(dataDir, { recursive: true, force: true });

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: 'postgres',
  password: 'postgres',
  port: 54321,
  persistent: false,
});

await pg.initialise();
await pg.start();
await pg.createDatabase('aseango');

const dbUrl = 'postgresql://postgres:postgres@127.0.0.1:54321/aseango';

const child = spawn(process.execPath, ['dist/server/main.js'], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    NODE_ENV: 'production',
    SUDA_DATABASE_URL: dbUrl,
    // 平台 HTTP 客户端需要一个基础域名；业务代码不会真正调用平台 API。
    FORCE_AUTHN_INNERAPI_DOMAIN: 'http://127.0.0.1:3999',
    PORT: String(PORT),
  },
});

let output = '';
const capture = (d) => {
  const s = d.toString();
  output += s;
  process.stdout.write(s);
};
child.stdout.on('data', capture);
child.stderr.on('data', capture);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let exitCode = 0;
try {
  // 等待启动（最多 30 秒）
  let started = false;
  for (let i = 0; i < 30; i++) {
    await sleep(1000);
    if (output.includes('Server running')) { started = true; break; }
    if (output.includes('ExceptionHandler') || output.includes('Error:')) break;
  }
  if (!started) throw new Error('应用未在 30 秒内启动');

  // 请求首页
  const res = await fetch(`http://127.0.0.1:${PORT}/`);
  const html = await res.text();
  console.log(`\n首页 HTTP 状态: ${res.status}, 长度: ${html.length}`);
  if (!res.ok || html.length < 100) throw new Error('首页返回异常');
  if (html.includes('东盟智贸')) console.log('✅ 首页品牌标题正确');
  console.log('✅ 应用完整启动并可访问');
} catch (e) {
  console.error('❌ 启动验证失败:', e.message);
  exitCode = 1;
} finally {
  child.kill();
  await sleep(1000);
  await pg.stop();
  process.exit(exitCode);
}
