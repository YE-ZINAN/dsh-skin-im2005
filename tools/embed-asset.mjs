// Inline assets into client.js as base64 data URIs.
//
// The browser-side plugin module cannot read the filesystem, and registering a
// static route on the host would need an undocumented ctx.webServer API. So the
// artwork is inlined and the plugin stays fully self-contained.
//
// Re-run after replacing any asset:
//   node dsh-skin-qq2005/tools/embed-asset.mjs
//
// Every asset is optional: a missing file yields an empty const, and the client
// falls back to its built-in original SVG artwork, so the skin never renders blank.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const ROOT = path.resolve(import.meta.dirname, '..')
const CLIENT = path.join(ROOT, 'client.js')
const BEGIN = '/* ASSET:BEGIN */'
const END = '/* ASSET:END */'

const ASSETS = [
  { file: 'qqshow.jpg', name: 'QQSHOW_SRC', label: 'QQ秀 立绘' },
  { file: 'penguin.png', name: 'PENGUIN_SRC', label: '企鹅图标' },
  { file: 'avatar.png', name: 'AVATAR_SRC', label: '侧栏头像' },
]

const mimeOf = (buf) => {
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'image/jpeg'
  if (buf.slice(0, 8).toString('hex') === '89504e470d0a1a0a') return 'image/png'
  if (buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') return 'image/webp'
  if (buf.slice(0, 6).toString('ascii').startsWith('GIF8')) return 'image/gif'
  return 'application/octet-stream'
}

const lines = [BEGIN]
let totalUri = 0
const report = []

for (const a of ASSETS) {
  const p = path.join(ROOT, 'assets', a.file)
  if (!fs.existsSync(p)) {
    lines.push('    // ' + a.file + ' 缺失 —— 使用内置原创 SVG 兜底')
    lines.push("    const " + a.name + " = ''")
    report.push('  ' + a.file.padEnd(14) + 'MISSING -> ' + a.name + " = ''（走 SVG 兜底）")
    continue
  }
  const buf = fs.readFileSync(p)
  const uri = 'data:' + mimeOf(buf) + ';base64,' + buf.toString('base64')
  totalUri += uri.length
  lines.push('    // ' + a.label + '  ' + a.file + '  sha256:' +
    crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16) +
    '  ' + buf.length + ' B')
  lines.push("    const " + a.name + " = '" + uri + "'")
  report.push('  ' + a.file.padEnd(14) + (buf.length / 1024).toFixed(1) + ' KB -> ' + a.name +
    ' (' + (uri.length / 1024).toFixed(1) + ' KB data URI)')
}
lines.push('    ' + END)

const src = fs.readFileSync(CLIENT, 'utf8')
const i = src.indexOf(BEGIN)
const j = src.indexOf(END)
if (i < 0 || j < 0 || j < i) {
  console.error('client.js is missing the ' + BEGIN + ' … ' + END + ' marker region')
  process.exit(1)
}

const out = src.slice(0, i) + lines.join('\n') + src.slice(j + END.length)
fs.writeFileSync(CLIENT, out, 'utf8')

console.log(report.join('\n'))
console.log('  ----')
console.log('  data URI 合计 : ' + (totalUri / 1024).toFixed(1) + ' KB')
console.log('  client.js     : ' + (out.length / 1024).toFixed(1) + ' KB')
