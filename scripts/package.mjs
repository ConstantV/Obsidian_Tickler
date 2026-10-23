import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'tickler-package-'));
try {
  const folder = path.join(dir, 'obsidian-tickler');
  await fs.mkdir(folder);

  const paths = execFileSync('npm', ['ls', '--omit=dev', '--all', '--parseable'], { encoding: 'utf8' })
    .trim().split('\n').slice(1);
  let notices = 'License notices for bundled runtime dependencies\n\n';
  for (const packagePath of paths) {
    const info = JSON.parse(await fs.readFile(path.join(packagePath, 'package.json'), 'utf8'));
    const files = await fs.readdir(packagePath);
    const license = files.find(name => /^licen[cs]e(?:\.|$)/i.test(name));
    notices += `===== ${info.name} ${info.version} (${info.license || 'see package'}) =====\n`;
    notices += license
      ? await fs.readFile(path.join(packagePath, license), 'utf8') + '\n\n'
      : 'License file not included in npm package; see package metadata.\n\n';
  }
  await fs.writeFile('THIRD_PARTY_NOTICES.txt', notices);

  const releaseFiles = ['main.js', 'manifest.json', 'styles.css', 'LICENSE', 'THIRD_PARTY_NOTICES.txt'];
  for (const file of releaseFiles) await fs.copyFile(file, path.join(folder, file));
  const zip = path.resolve('delivery/obsidian-tickler-0.1.0.zip');
  await fs.rm(zip, { force: true });
  execFileSync('zip', ['-X', '-q', zip, ...releaseFiles.map(file => `obsidian-tickler/${file}`)], { cwd: dir });
  execFileSync('unzip', ['-tq', zip]);

  const manifest = JSON.parse(await fs.readFile('manifest.json', 'utf8'));
  if (manifest.id !== 'obsidian-tickler' || manifest.version !== '0.1.0' || !manifest.isDesktopOnly) {
    throw new Error('Invalid manifest');
  }
  execFileSync(process.execPath, ['--check', 'main.js']);
  const entries = execFileSync('unzip', ['-Z1', zip], { encoding: 'utf8' }).trim().split('\n');
  if (entries.length !== releaseFiles.length || releaseFiles.some(file => !entries.includes(`obsidian-tickler/${file}`))) {
    throw new Error('Release contains unexpected files');
  }
  await fs.writeFile('delivery/package-results.json', JSON.stringify({
    status: 'passed', entries, manifest, bytes: (await fs.stat(zip)).size
  }, null, 2));
} finally {
  await fs.rm(dir, { recursive: true, force: true });
}
