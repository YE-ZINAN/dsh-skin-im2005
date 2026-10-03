import fs from 'node:fs'
// Offline regression test for dsh-skin-im2005's client half.
//
// Evaluates the real client.js, drives the real plugin module with a fake ctx
// whose theme.overrideTokens implements DSH's real validation rule, RENDERS every
// registered component, and CLICKS the real controls.
//
// Keep this. It has already caught:
//   - token overrides passed as bare strings (validateOverrides rejects the WHOLE layer)
//   - a hook-state bug in this very fixture
//   - unstyled class components (the error boundaries)

// Node 24 exposes `navigator` as a getter-only global — redefine it.
Object.defineProperty(globalThis, 'navigator', {
  value: { clipboard: { writeText: () => Promise.resolve() } },
  configurable: true, writable: true,
})

const file = 'file:///' + process.cwd().replace(/\\/g, '/') + '/dsh-skin-im2005/client.js'

let captured = null
const lsData = new Map()
// ---- 提醒的夹具：假的 DOM / MutationObserver / AudioContext ----
// 全部在 import 之前装好，因为 plug in 的 apply() 里会立刻检查它们。
const fake = { running: false, pending: false, session: 's1', scopeAlive: true, noScope: false, rafCalls: 0, moCb: null, moCbs: [], bursts: 0, tones: 0, audioPlays: 0, audioSrc: '', disconnected: 0, runEffects: false }
// 会话容器：isConnected 用 getter —— 要能模拟"运行中被换成别的会话（旧节点断开）"
const scopeOf = () => ({
  get isConnected() { return fake.scopeAlive },
  getAttribute: (n) => (n === 'data-conversation-session' ? fake.session : null),
})
globalThis.document = {
  body: {},
  contains: (el) => !!(el && el.isConnected !== false),
  querySelector: (sel) => {
    const s = String(sel)
    if (s.indexOf('data-chat-running') >= 0) {
      // 标记元素带 closest()，客户端靠它往上找"这一轮长在哪个会话容器里"
      return fake.running ? { closest: () => (fake.noScope ? null : scopeOf()) } : null
    }
    if (s.indexOf('data-conversation-session') >= 0) return scopeOf()
    return fake.pending ? {} : null
  },
}
globalThis.MutationObserver = class {
  constructor(cb) { fake.moCbs.push(cb); if (!fake.moCb) fake.moCb = cb }
  observe() {}
  disconnect() { fake.disconnected++ }
}
// 可控的 rAF 队列：球桌的动画循环要能被测试一步步驱动
globalThis.rafQueue = []
globalThis.requestAnimationFrame = (fn) => { fake.rafCalls++; globalThis.rafQueue.push(fn); return globalThis.rafQueue.length }
globalThis.cancelAnimationFrame = () => {}
// 说明：这个队列**永远不会被自动驱动** —— 等价于"窗口在后台"（隐藏窗口里 rAF 会被浏览器
// 完全暂停）。提醒功能的采样调度一旦依赖 rAF，第 9 节会失败（用户实测"后台不响、点开才响"）。
// 球桌动画循环则由测试显式从队列里取回调来推（第 11 节）。
globalThis.AudioContext = class {
  constructor() { this.state = 'running'; this.sampleRate = 8000; this.currentTime = 0; this.destination = {} }
  createBuffer(ch, len) { return { getChannelData: () => new Float32Array(len) } }
  createBufferSource() { fake.bursts++; return { buffer: null, connect() {}, start() {}, stop() {} } }
  createBiquadFilter() { return { type: '', frequency: { value: 0, setValueAtTime() {} }, Q: { value: 0 }, connect() {} } }
  createGain() { return { gain: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {} } }
  // 台球音效里的"撞库/出杆"用正弦振荡器（提醒功能不用它）
  createOscillator() {
    fake.tones++
    return { type: '', frequency: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, start() {}, stop() {} }
  }
  resume() {}
}
// 发声有两条路径：有内联音频就走 <audio>，没有就走现场合成。
// 两条都要能数出来，否则没有音频的那个版本跑测试会假失败。
globalThis.Audio = class {
  constructor(src) { fake.audioSrc = String(src || ''); this.src = src; this.volume = 1; this.preload = ''; this.currentTime = 0 }
  play() { fake.audioPlays++; return { catch() {} } }
}
globalThis.window = {
  __ModuleLoader__: { load: (m) => { captured = m } },
  open: (url) => { openedUrls.push(String(url)); return null },
  AudioContext: globalThis.AudioContext,
  Audio: globalThis.Audio,
  localStorage: {
    getItem: (k) => (lsData.has(k) ? lsData.get(k) : null),
    setItem: (k, v) => lsData.set(k, String(v)),
    removeItem: (k) => lsData.delete(k),
  },
}
// 关键夹具设定：**在 import 之前**就把"运行中"置为真。
// 模拟"打开界面时这一轮已经在跑"—— 会话状态可能是从快照恢复出来的陈旧值，或界面还在水合。
// 第 9 节据此验证：那次"结束"不该被当作任务完成（否则每次打开界面都会误咳一声）。
fake.running = true
await import(file)

const fail = (m) => { console.error('FAIL: ' + m); process.exit(1) }
const ok = (m) => console.log('  ✓ ' + m)
if (!captured) fail('client.js did not call __ModuleLoader__.load')
if (captured.id !== 'dsh-skin-im2005') fail('module id = ' + captured.id)

// ---------------- fake React: per-component hook state, like the real thing ----
let currentComp = null
let hookIdx = 0
const stateMap = new WeakMap()
const refMap = new WeakMap()
const effMap = new WeakMap()
fake.cleanups = []

const React = {
  // Real React also exposes children as props.children — components that read
  // `props.children` (like our ImSection wrapper) depend on it.
  createElement: (type, props, ...children) => {
    const p = props || {}
    const kids = children.flat(9)
    if (kids.length) p.children = kids.length === 1 ? kids[0] : kids
    return { type, props: p, children: kids }
  },
  useState: (init) => {
    let a = stateMap.get(currentComp)
    if (!a) { a = []; stateMap.set(currentComp, a) }
    const i = hookIdx++
    if (a.length <= i) a[i] = typeof init === 'function' ? init() : init
    return [a[i], (v) => { a[i] = typeof v === 'function' ? v(a[i]) : v }]
  },
  // useRef：和真 React 一样，ref 对象跨"渲染"存活（球桌窗口靠它拿 canvas 与引擎实例）
  useRef: (init) => {
    let a = refMap.get(currentComp)
    if (!a) { a = []; refMap.set(currentComp, a) }
    const i = hookIdx++
    if (a.length <= i) a[i] = { current: init }
    return a[i]
  },
  // useEffect：默认**不跑**（Clock 里那个 setInterval 会让测试进程挂着不退出）；
  // 只在 fake.runEffects 打开时按"每个组件每槽位只跑一次"的挂载语义跑一次。
  useEffect: (fn) => {
    const i = hookIdx++
    if (!fake.runEffects || typeof fn !== 'function') return
    let a = effMap.get(currentComp)
    if (!a) { a = []; effMap.set(currentComp, a) }
    if (a[i]) return
    a[i] = true
    try {
      const cleanup = fn()
      if (typeof cleanup === 'function') fake.cleanups.push(cleanup)
    } catch (err) { fail('useEffect 回调抛错: ' + err.message) }
  },
}
class FakeComponent { constructor(props) { this.props = props || {} } }
React.Component = FakeComponent

// class components (our error boundaries) need `new`, not a plain call.
// Hook state is keyed BY COMPONENT and the hook cursor is reset per component,
// exactly like real React — otherwise any helper that walks the tree would shift
// the cursor and make a later re-render read the wrong state.
const instantiate = (Comp, props) => {
  const prevComp = currentComp
  const prevIdx = hookIdx
  currentComp = Comp
  hookIdx = 0
  try {
    if (Comp.prototype && typeof Comp.prototype.render === 'function') {
      const inst = new Comp(props || {})
      inst.props = props || {}
      if (!inst.state) inst.state = {}
      return inst.render()
    }
    return Comp(props || {})
  } finally {
    currentComp = prevComp
    hookIdx = prevIdx
  }
}
// render + re-render: this component's own state survives
const render = (comp) => instantiate(comp)

// ---------------- the rule copied from ui-theme validateOverrides ----------------
function validateOverrides(source, tokens) {
  const out = {}
  for (const [name, value] of Object.entries(tokens)) {
    if (typeof value === 'string') throw new TypeError(`theme override "${name}" from "${source}" is a bare string`)
    if (typeof value !== 'object' || value === null ||
        typeof value.light !== 'string' || typeof value.dark !== 'string') {
      throw new TypeError(`theme override "${name}" from "${source}" must map to a { light, dark } pair`)
    }
    out[name] = value
  }
  return out
}

// ---------------- fake ctx ----------------
const calls = []
let disposeCount = 0
const regs = new Map()          // keyed by id — a list slot may hold several
const openedUrls = []           // window.open 的调用记录
const themeCalls = []           // ctx.theme.setTheme 的调用记录
const fontCalls = []            // ctx.theme.setFontSize 的调用记录

const ctx = {
  effect: (fn) => { const d = fn(); return () => { try { d && d() } catch (e) {} } },
  on: () => () => {},
  __themeCalls: themeCalls,
  __fontCalls: fontCalls,
  locale: { getSnapshot: () => ({ active: 'zh-CN' }) },
  // first-party account Remote, mocked: 12.3456 CNY must render as ¥12.34 (round DOWN)
  remote: {
    account: {
      getBalance: (meta) => {
        ctx.__meta = meta
        return { ok: true, value: { status: 'ready', value: [{ currency: 'CNY', balance: '12.3456' }], bonusWallets: [] } }
      },
      // 「用户头像」来自一方 getProfile（与左下角圆形头像同源）
      getProfile: (meta) => {
        ctx.__profileMeta = meta
        if (ctx.__noAvatar) return { ok: true, value: { status: 'ready', value: { id: 'u1', name: '测试用户', contact: null } } }
        return { ok: true, value: { status: 'ready', value: { id: 'u1', name: '测试用户', contact: 'tester', avatarUrl: 'https://example.invalid/wechat-avatar.png' } } }
      },
      // getState 给出官方的用量页 / 充值页地址
      getState: (meta) => {
        ctx.__stateMeta = meta
        return { ok: true, value: { status: 'credential-stored', links: { usageUrl: 'https://example.invalid/usage', topUpUrl: 'https://example.invalid/topup' } } }
      },
    },
  },
  theme: {
    overrideTokens: (source, tokens) => {
      try {
        const ok2 = validateOverrides(source, tokens)
        calls.push({ ok: true, count: Object.keys(ok2).length, names: Object.keys(ok2) })
      } catch (e) { calls.push({ ok: false, error: e.message }); throw e }
      return () => { disposeCount++ }
    },
    // 主题包文档里 setTheme / setFontSize 是唯一的写入口
    setTheme: (id) => { ctx.__themeCalls.push(id) },
    setFontSize: (px) => { ctx.__fontCalls.push(px) },
    getTheme: () => ({
      preference: 'system', fontSize: 14, revision: 1,
      active: { colorScheme: 'light' },
      themes: [{ id: 'light' }, { id: 'dark' }],
    }),
  },
  slots: {
    inject: (name, fn) => fn(),
    register: (opts, comp) => { regs.set(opts.id, { opts, comp }); return () => {} },
  },
}

const mod = captured.factory((n) => { if (n === 'react') return React; throw new Error('require ' + n) })

console.log('=== 0. 模块声明 ===')
// dotted remote namespaces are SEPARATE services — `remote` alone is not enough
for (const need of ['slots', 'theme', 'locale', 'remote', 'remote.account']) {
  if (!Array.isArray(mod.inject) || !mod.inject.includes(need)) {
    fail('inject 缺少 "' + need + '" —— 缺了会抛 cannot get property ... without inject')
  }
}
ok('inject = ' + JSON.stringify(mod.inject))
if (!mod.inject.includes('@deepseek-ai/dsh-api-remotes')) {
  // package-level ordering lives in package.json; assert it there instead
  const { readFileSync } = await import('node:fs')
  const pkg = JSON.parse(readFileSync('dsh-skin-im2005/package.json', 'utf8'))
  const list = (pkg.dsh && pkg.dsh.client && pkg.dsh.client.inject) || []
  if (!list.includes('@deepseek-ai/dsh-api-remotes')) {
    fail('package.json 的 dsh.client.inject 缺少 @deepseek-ai/dsh-api-remotes（启动顺序）')
  }
  ok('package.json dsh.client.inject 含 @deepseek-ai/dsh-api-remotes')
}

mod.apply(ctx)

console.log('=== 1. 主题层 ===')
if (calls.length !== 1) fail('apply 后应恰好 1 次 overrideTokens，实际 ' + calls.length)
if (!calls[0].ok) fail('layer rejected: ' + calls[0].error)
ok('overrideTokens 接受 ' + calls[0].count + ' tokens（标准）')

console.log('\n=== 2. slot 注册（全部必须是 list 槽，或显式 shadow）===')
// Every entry is a MULTI-OCCUPANCY slot (list/chain/keyed) except the brand
// mark, which is a single slot we deliberately shadow with priority -1.
const EXPECT = [
  ['conversation.composer.dock', 'im2005-skin-control'],
  ['shell.overlay', 'im2005-show'],
  ['shell.overlay', 'im2005-strip'],
  ['sidebar.footer.action', 'im2005-footer'],
  ['conversation.session.header.actions', 'im2005-header-actions'],
  ['conversation.input.dock', 'im2005-toolbar'],
  ['shell.overlay', 'im2005-profile'],
  ['shell.overlay', 'im2005-balance'],
  ['sidebar.brand.mark', 'im2005-brand'],
]
// slots that must NOT be touched: either `single` and owned by the host, or a
// REGISTRY rather than a content area.
// sidebar.panellist is kind=list BUT it is the MAIN PANEL REGISTRY: registering
// there makes the layout call selectPanel(<id>), which throws
//   layout.selectPanel: main panel "<id>" is not registered
// as an UNCAUGHT error, so the whole client plugin fails to activate and the app
// will not boot. That crash happened for real — keep it forbidden.
const FORBIDDEN = ['conversation.session.header', 'conversation.composer.bar', 'shell.leading',
  'conversation.header', 'conversation.hero.brand.mark', 'sidebar.panellist']
for (const [slot, id] of EXPECT) {
  const r = regs.get(id)
  if (!r) fail('未注册: ' + id)
  if (r.opts.name !== slot) fail(id + ' 注册到了 ' + r.opts.name + '，期望 ' + slot)
  ok(slot.padEnd(38) + ' -> ' + id + (r.opts.priority !== undefined ? '  (priority ' + r.opts.priority + ')' : ''))
}
for (const r of regs.values()) {
  if (FORBIDDEN.includes(r.opts.name)) fail('注册到了 single 槽（会报错）: ' + r.opts.name)
}
ok('未触碰任何 single 槽（' + FORBIDDEN.length + ' 个已排除）')
const brand = regs.get('im2005-brand')
if (brand.opts.priority !== -1) fail('sidebar.brand.mark 是 single 槽，必须用 priority:-1 抢占')

console.log('\n=== 2b. 顶部渐变 CSS（由 list 槽承载，不依赖任何 single 槽）===')
const findStyles = (n, out, depth) => {
  const d = depth || 0
  if (!n || typeof n !== 'object' || d > 12) return out
  if (typeof n.type === 'function') { try { return findStyles(instantiate(n.type, n.props), out, d + 1) } catch (e) { return out } }
  if (n.type === 'style' && n.props && typeof n.props.children === 'string') out.push(n.props.children)
  ;(n.children || []).forEach((c) => findStyles(c, out, d + 1))
  return out
}
const chromeCss = findStyles(render(regs.get('im2005-skin-control').comp), []).join('')
if (!chromeCss.includes('[data-windows-titlebar]')) fail('缺少 data-windows-titlebar 渐变规则')
if (!chromeCss.includes('linear-gradient')) fail('缺少渐变值')
if (!chromeCss.includes('_frame')) fail('缺少条带选择器')
if (!chromeCss.includes('_leadingSeat')) fail('缺少条带文字变白规则')
// 工作区名行：白底 + 黑色标题（用户要求）
if (!/_projectRow"\]\{background:#ffffff/.test(chromeCss)) fail('工作区名行应为白底')
if (chromeCss.includes('#eaf1fb')) fail('工作区名行仍是旧的蓝渐变背景')
if (!/_projectRow"\] \[class\*="_title"\]\{font-weight:bold!important;color:#000000/.test(chromeCss)) {
  fail('工作区名应为黑色')
}
// 列表内所有文字：黑色宋体，且必须排除选中行（蓝底白字不能被覆盖）
if (!chromeCss.includes('font-family:"SimSun","宋体",serif!important')) fail('列表文字未指定宋体')
if (!/\[class\*="_sessionRow"\]:not\(\[class\*="_selected"\]\)/.test(chromeCss)) {
  fail('「全部黑字」规则必须排除选中行（否则蓝底上黑字看不清）')
}
ok('工作区名行白底黑字；列表文字黑色宋体（选中行仍为蓝底白字）')
// 工作区下面的任务列表 = 白底，且必须用 :has([data-row-key]) 精确锁定（_list 被 6 个包共用）
if (!/\[class\*="_list"\]:has\(\[data-row-key\]\):not\(\[class\*="_listArea"\]\)\{background:#ffffff/.test(chromeCss)) {
  fail('缺少「任务列表白底」规则（应锁在 :has([data-row-key]):not(_listArea) 上）')
}
if (/\[class\*="_list"\]\{background/.test(chromeCss)) fail('白底不能只写 [class*="_list"]（6 个包共用，会误伤）')
// 白底必须裁到内容区：否则右侧那条滚动/拖拽栏也变白，和主会话的白连成一片
if (!chromeCss.includes('background-clip:content-box!important')) {
  fail('白底必须 background-clip:content-box，否则滚动/拖拽栏会被一起刷白')
}
// ⚠️ 子串选择器越界守卫：`[class*="_list"]` 会同时命中 `_listArea`（带负 margin-right、
//    往右多伸一截、会盖住拖拽栏），必须显式排除
if (!chromeCss.includes(':has([data-row-key]):not([class*="_listArea"])')) {
  fail('白底规则未排除 _listArea —— 子串匹配会误伤它，拖拽栏会继续是白的')
}
// 滚动条轨道要单独染回侧栏浅蓝
if (!/\[class\*="_list"\]:has\(\[data-row-key\]\):not\(\[class\*="_listArea"\]\)::-webkit-scrollbar-track\{background:var\(--dsw-specific-sidebar-fill/.test(chromeCss)) {
  fail('滚动条轨道未染回侧栏浅蓝')
}
// 行左符号：藏文件夹、显示宿主自带的三角（展开自动转 ▼）
if (!chromeCss.includes('_projectRow"] [class*="_folder"]{display:none')) fail('未藏掉分组行的文件夹图标')
if (!chromeCss.includes('_projectRow"] [class*="_chevron"]{display:inline-flex')) fail('未显示分组行的右向三角')
// ⚠️ _chevron 被 14 个包共用、_folder 2 个包 —— 必须限定在 _projectRow 内
if (/(^|[,{])[^{,]*\[class\*="_chevron"\]/.test(chromeCss.replace(/\[class\*="_projectRow"\] \[class\*="_chevron"\]/g, ''))) {
  fail('存在未限定在 _projectRow 内的 _chevron 规则（14 个包共用，会误伤）')
}
// 右侧栏同色必须限定在「展开态」：data-sidebar-right-panel 是常驻属性，
// 挂在它上面会导致收起后蓝底留在原位挡住内容（真出过一次）
if (!chromeCss.includes('[data-sidebar-right-open]{')) fail('右侧栏同色未挂在 data-sidebar-right-open（展开态）上')
if (chromeCss.includes('[data-sidebar-right-panel],')) fail('右侧栏同色不能挂在常驻的 data-sidebar-right-panel 上')
if (/\[data-sidebar-right-panel\]\s*(,|\{)/.test(chromeCss)) fail('仍有用 data-sidebar-right-panel 上色的规则')
// 会话栏顶部条必须用 header[data-window-drag]（从真实 JSX 读出的结构），且用采样出的色样
if (!chromeCss.includes('header[data-window-drag]{background:')) fail('缺少会话栏顶部条上色规则')
if (!chromeCss.includes('#e9edfa') || !chromeCss.includes('#c1bffa')) {
  fail('顶部条渐变与采样色值不一致（应为 #e9edfa → #dcdbfc → #c1bffa）')
}
// 档案卡是浮层：必须同时有「下推侧栏」的规则，否则就是"盖"在宿主行上面
if (!chromeCss.includes(':has(> [class*="_logoRow"])')) fail('缺少下推侧栏的 :has() 规则')
if (!chromeCss.includes('padding-top:92px')) fail('下推高度与 PROFILE_CARD_H 不一致')
// 侧栏收起时必须撤掉下推、并隐藏浮层卡片，否则折叠轨道上留一块蓝底
if (!chromeCss.includes(':not([class*="_collapsed"])')) fail('下推规则未排除收起态（折叠后会留蓝底）')
if (!chromeCss.includes('.dsh-skin-im2005-profile{display:none')) fail('收起态未隐藏档案卡浮层')
if (!calls[0].names.includes('--dsw-specific-sidebar-fill')) {
  fail('token 层缺少 --dsw-specific-sidebar-fill（左侧栏底色）')
}
ok('顶部渐变 + 侧栏 IM 分组 + 右侧栏同色 已注入 (' + chromeCss.length + ' 字符)')

// 皮肤控件右侧的 token/槽位信息栏：正常态必须不再出现（用户要求去掉）。
// 注意要排除 <style> 节点 —— 它的 children 是 CSS 文本，不是界面文字。
const ctlTexts = []
const grabCtlText = (n, d) => {
  const dd = d || 0
  if (!n || typeof n !== 'object' || dd > 12) return
  if (typeof n.type === 'function') { try { return grabCtlText(instantiate(n.type, n.props), dd + 1) } catch (e) { return } }
  if (n.type === 'style') return
  for (const c of (n.children || [])) {
    if (typeof c === 'string') ctlTexts.push(c)
    else grabCtlText(c, dd + 1)
  }
}
grabCtlText(render(regs.get('im2005-skin-control').comp))
const ctlTxt = ctlTexts.join(' ')
if (/tokens|slots\s*\d|主题层/.test(ctlTxt)) {
  fail('正常态不应再显示 token/诊断信息栏，实得: ' + JSON.stringify(ctlTxt))
}
ok('皮肤控件右侧的 token 信息栏已移除（仅主题层失败时才显示）')

// 消息抬头 = IM 聊天记录风（名字 + 时间，常显）
// 必须同时覆盖 data-clock 的 start（用户，抬头在气泡上方）与 end（AI，宿主把
// TurnTailNodeView 的抬头行放在回答下方）—— 只写 start 会让 AI 那边一个字都没有。
if (!chromeCss.includes('[data-chat-flow-kind] [class*="_actions"][data-clock]{opacity:1')) {
  fail('消息抬头未设为常显（宿主默认只在悬停时显示）')
}
if (!chromeCss.includes('[class*="_actions"][data-clock]::before')) {
  fail('名称标签必须同时覆盖 data-clock 的 start 与 end（AI 用的是 end）')
}
if (chromeCss.includes('[class*="_actions"][data-clock="start"]{')) {
  fail('名称/常显规则不应只限定在 data-clock="start"（AI 的抬头行是 end）')
}
if (!chromeCss.includes('content:var(--dsh-im-username,"我")')) fail('用户发言的名称标签未注入')
if (!chromeCss.includes('content:"DeepSeek"')) fail('AI 发言的名称标签未注入')
if (!chromeCss.includes('[class*="_timeStart"],') || !chromeCss.includes('[class*="_timeEnd"]{color:#6b6b6b')) {
  fail('时间戳未同时覆盖 _timeStart / _timeEnd，或未改成 IM 记录里的灰')
}
// ⚠️ 子串守卫：_action 是 _actions 的前缀子串，必须 :not 掉容器
if (!chromeCss.includes('[class*="_action"]:not([class*="_actions"])')) {
  fail('_action 规则未排除 _actions 容器（子串匹配会误伤）')
}
// 绿名以 CSS 变量注入（content 不能直接读 JS 数据）——
// 变量值本身在「皮肤控件」里注入，见 6d 的断言（必须是昵称，不是账号名）。
ok('消息抬头: 名字(我的昵称/AI) + 时间 常显，时间转灰（IM 聊天记录风）')
// ⚠️ 子串 + 共用守卫：_actions 被 10 个包共用、_action 被 8 个包共用，
// 必须始终限定在 [data-chat-flow-kind]（+ data-clock）之内。
const bareActions = chromeCss.replace(/\[data-chat-flow-kind\][^{}]*\[class\*="_actions"\][^{}]*/g, '')
if (/\[class\*="_actions?"\]/.test(bareActions)) {
  fail('存在未限定在 data-chat-flow-kind 内的 _actions/_action 规则（10 个包共用，会误伤）')
}

console.log('\n=== 3. 渲染每个组件并统计真实控件 ===')
const walk = (n, out, depth) => {
  const d = depth || 0
  if (!n || typeof n !== 'object' || d > 12) return out
  if (typeof n.type === 'function') {
    try { return walk(instantiate(n.type, n.props), out, d + 1) } catch (e) { return out }
  }
  if (typeof n.type === 'string' && n.props && typeof n.props.onClick === 'function') out.push(n)
  ;(n.children || []).forEach((c) => walk(c, out, d + 1))
  return out
}
let totalCtrls = 0
for (const [, id] of EXPECT) {
  let tree
  try { tree = render(regs.get(id).comp) } catch (e) { fail('渲染 ' + id + ' 抛错: ' + e.message) }
  const ctrls = walk(tree, [])
  totalCtrls += ctrls.length
  console.log(`  ${id.padEnd(26)} 控件 ${String(ctrls.length).padStart(2)} 个`)
}
if (totalCtrls < 6) fail('真实控件数量异常偏少: ' + totalCtrls)
ok('合计 ' + totalCtrls + ' 个真实控件')

console.log('\n=== 4. 点击循环按钮走遍三档 ===')
const dockTree = render(regs.get('im2005-skin-control').comp)
const cycleBtn = walk(dockTree, []).find((b) => b.type === 'button')
if (!cycleBtn) fail('找不到循环按钮')
cycleBtn.props.onClick()   // -> 浓烈
cycleBtn.props.onClick()   // -> 关
cycleBtn.props.onClick()   // -> 标准
if (calls.some((c) => !c.ok)) fail('有变体被拒')
if (calls.length !== 3) fail('预期 3 次，实际 ' + calls.length)
if (disposeCount < 2) fail('切换未释放上一层, disposeCount=' + disposeCount)
ok('三档 token 全部合规；disposer 释放 ' + disposeCount + ' 次')

console.log('\n=== 5. 工具条按钮（余额 / 形象秀固定 [+ 提醒声]）===')
const toolBtns = walk(render(regs.get('im2005-toolbar').comp), [])
const labels = toolBtns.map((b) => (b.children || []).map((c) => (c && c.children) || c).join(''))
// 公开版把「提醒」整块剥掉了，所以按钮数随版本不同 —— 由标签自己判断，不写死。
const HAS_NOTIFY = labels.some((l) => String(l).includes('提醒'))
const HAS_POOL = labels.some((l) => String(l).includes('美式八球'))
const HAS_MINE = labels.some((l) => String(l).includes('扫雷'))
const HAS_NOTE = labels.some((l) => String(l).includes('跨会话备注框'))
const HAS_FARM = labels.some((l) => String(l).includes('Token农场'))
if (!labels.some((l) => String(l).includes('余额'))) fail('缺少余额按钮，实得 ' + JSON.stringify(labels))
if (!labels.some((l) => String(l).includes('形象秀'))) fail('缺少 形象秀固定按钮，实得 ' + JSON.stringify(labels))
if (!HAS_POOL) fail('缺少「美式八球」按钮，实得 ' + JSON.stringify(labels))
if (!HAS_MINE) fail('缺少「扫雷」按钮，实得 ' + JSON.stringify(labels))
if (!HAS_NOTE) fail('缺少「跨会话备注框」按钮，实得 ' + JSON.stringify(labels))
if (!HAS_FARM) fail('缺少「Token农场」按钮，实得 ' + JSON.stringify(labels))
{
  const want = 2 + (HAS_NOTIFY ? 1 : 0) + (HAS_POOL ? 1 : 0) + (HAS_MINE ? 1 : 0) + (HAS_NOTE ? 1 : 0) + (HAS_FARM ? 1 : 0)
  if (toolBtns.length !== want) fail('工具条按钮数应为 ' + want + '，实际 ' + toolBtns.length)
  // 顺序也要钉住：备注框排在「提醒声」之后、「美式八球」之前（用户指定）
  {
    const at = (kw) => labels.findIndex((l) => String(l).includes(kw))
    if (!(at('跨会话备注框') > 0)) fail('找不到备注框按钮')
    if (at('提醒声') >= 0 && !(at('提醒声') < at('跨会话备注框'))) {
      fail('备注框应排在提醒声之后，实得 ' + JSON.stringify(labels))
    }
    if (!(at('跨会话备注框') < at('美式八球'))) fail('备注框应排在美式八球之前，实得 ' + JSON.stringify(labels))
    if (!(at('Token农场') > at('扫雷'))) fail('农场应排在扫雷之后，实得 ' + JSON.stringify(labels))
  }
}
ok(toolBtns.length + ' 个按钮: ' + JSON.stringify(labels))

// 点击「余额」-> 调一方 Remote -> 弹窗显示格式化金额
toolBtns[0].props.onClick()
await new Promise((r) => setTimeout(r, 0))
if (!ctx.__meta || typeof ctx.__meta.timezoneOffsetSeconds !== 'number') fail('未以 accountClientMetadata 形状调用 getBalance')
if (typeof ctx.__meta.version !== 'string' || !ctx.__meta.version) fail('metadata.version 缺失')
ok('调用 ctx.remote.account.getBalance（version=' + ctx.__meta.version + '，tz=' + ctx.__meta.timezoneOffsetSeconds + '）')

const collectText = (n, out, depth) => {
  const d = depth || 0
  if (d > 14 || n == null) return out
  if (typeof n === 'string' || typeof n === 'number') { out.push(String(n)); return out }
  if (typeof n !== 'object') return out
  if (typeof n.type === 'function') { try { return collectText(instantiate(n.type, n.props), out, d + 1) } catch (e) { return out } }
  ;(n.children || []).forEach((c) => collectText(c, out, d + 1))
  return out
}
const dialogTree = render(regs.get('im2005-balance').comp)
const txt = collectText(dialogTree, []).join(' | ')
if (!txt.includes('¥12.34')) fail('弹窗未显示 ¥12.34（向下取整规则），实得: ' + txt)
ok('弹窗显示 ¥12.34（12.3456 向下取整，官方 formatBalance 规则）')

// 再点一次「余额」应关闭弹窗（toggle）
toolBtns[0].props.onClick()
const afterClose = collectText(render(regs.get('im2005-balance').comp), []).join(' | ')
if (afterClose.includes('¥')) fail('再点余额未关闭弹窗，实得: ' + afterClose)
ok('再点「余额」-> 弹窗关闭（toggle）')

// 点击「形象秀 固定」-> 钉住面板
// render() returns the error boundary's output, so unwrap to the host element.
const rootOf = (comp) => {
  let n = render(comp)
  let guard = 0
  while (n && typeof n.type === 'function' && guard++ < 6) n = instantiate(n.type, n.props)
  return n
}
// 展开 = 渲染出那个 width:176 且 bottom:0 的固定面板（折叠态只有竖排标签）
const colOpen = (comp) => {
  let found = false
  const scan = (n, d) => {
    const dd = d || 0
    if (!n || typeof n !== 'object' || dd > 12) return
    if (typeof n.type === 'function') { try { return scan(instantiate(n.type, n.props), dd + 1) } catch (e) { return } }
    const st = n.props && n.props.style
    if (st && st.width === 176 && st.bottom === 0) found = true
    ;(n.children || []).forEach((c) => scan(c, dd + 1))
  }
  scan(rootOf(comp))
  return found
}
const showComp0 = regs.get('im2005-show').comp
if (colOpen(showComp0)) fail('固定前不应是展开面板')
toolBtns[1].props.onClick()
if (!colOpen(showComp0)) fail('固定后仍是折叠标签，固定按钮未生效')
ok('形象秀固定：折叠态 -> 固定后展开整列')

// 「不擋住 + 能拖拽」的核心不变量：
//   给 frame 腾位的 padding 与给右栏拖拽条的位移补偿，必须**成对出现且距离相同**
const reserveCss = findStyles(rootOf(showComp0), []).join('')
const padM = /_frame"\]:has\(\[class\*="_centerCol"\]\)\{padding-right:(\d+)px/.exec(reserveCss)
const hM = /\[data-side="rightbar"\]\{transform:translateX\(-(\d+)px\)/.exec(reserveCss)
if (!padM) fail('展开时未给 frame 腾位（应 padding-right）')
if (!hM) fail('缺少右栏拖拽条的位移补偿 —— 只腾位不补偿会让拖拽条错位（真出过这个 bug）')
if (padM[1] !== hM[1]) {
  fail('腾位距离(' + padM[1] + 'px)与拖拽条补偿距离(' + hM[1] + 'px)必须相同')
}
if (!reserveCss.includes('[class*="_centerCol"]')) fail('腾位选择器必须锁定 layout 的 frame（用 _centerCol 判定）')
// 回归守卫：绝不能靠 display:none 隐藏本列 —— 那会把竖标签一起藏掉，就再也点不出来
if (/\.dsh-skin-im2005-col\{display:none/.test(reserveCss)) {
  fail('不得用 display:none 隐藏本列（连竖标签都没了，就点不出来了）')
}
ok('腾位 ' + padM[1] + 'px + 拖拽条补偿 ' + hM[1] + 'px（成对、等距 → 不遮挡且拖拽正常）')

// 面板容器对指针透明 + 按钮显式接管 —— 拖拽条因此永不被吞掉
const colPanel = (function findPanel(n, d) {
  const dd = d || 0
  if (!n || typeof n !== 'object' || dd > 12) return null
  if (typeof n.type === 'function') { try { return findPanel(instantiate(n.type, n.props), dd + 1) } catch (e) { return null } }
  const st = n.props && n.props.style
  if (st && st.width === 176 && st.bottom === 0 && st.position === 'fixed') return n
  for (const c of (n.children || [])) { const r = findPanel(c, dd + 1); if (r) return r }
  return null
})(rootOf(showComp0))
if (!colPanel) fail('找不到 形象秀 列的面板容器')
if (colPanel.props.style.pointerEvents !== 'none') {
  fail('面板容器应 pointerEvents:none（否则会吞掉宿主右欄拖拽条的点击）')
}
const needAuto = walk(rootOf(showComp0), []).filter((b) => b.props.style && b.props.style.pointerEvents === 'auto')
if (needAuto.length < 5) fail('面板内的按钮应显式 pointerEvents:auto，实得 ' + needAuto.length + ' 个')
ok('面板 pointerEvents:none + ' + needAuto.length + ' 个按钮 auto（拖拽条不被吞、控件照常可点）')

console.log('\n=== 6. IM 右侧列：三段折叠面板 + 立绘 + 头像 ===')
toolBtns[1].props.onClick()      // 取消第 5 节的固定，回到折叠态
const showComp = regs.get('im2005-show').comp
const collapsed = render(showComp)
const showBtns = walk(collapsed, [])
if (!showBtns.length) fail('抽屉折叠态应有展开按钮')
showBtns[0].props.onClick()                    // setOpen(true)
const openTree = render(showComp)              // re-render, state preserved
// NOTE: do not walk() before findImgs — walking re-instantiates components and
// advances the hook cursor, which would make the drawer read the wrong state.
const findImgs = (n, out, depth) => {
  const d = depth || 0
  if (!n || typeof n !== 'object' || d > 12) return out
  if (typeof n.type === 'function') { try { return findImgs(instantiate(n.type, n.props), out, d + 1) } catch (e) { return out } }
  if (n.type === 'img' && n.props) out.push(n.props)
  ;(n.children || []).forEach((c) => findImgs(c, out, d + 1))
  return out
}
const imgs = findImgs(openTree, [])
// svg 要用**专用**查找器：walk() 只收集带 onClick 的节点（它的用途是数控件），
// 拿它过滤 svg 永远是空的 —— 这条断言以前从没被执行到，所以一直没暴露。
const findSvg = (n, out, depth) => {
  const d = depth || 0
  if (!n || typeof n !== 'object' || d > 12) return out
  if (typeof n.type === 'function') { try { return findSvg(instantiate(n.type, n.props), out, d + 1) } catch (e) { return out } }
  if (n.type === 'svg' || n.type === 'SVG') out.push(n.props || {})
  ;(n.children || []).forEach((c) => findSvg(c, out, d + 1))
  return out
}
// 两种合法形态：① 素材已内联 -> data: URI 的 <img>；② 干净版/公开版（非原创素材已剥离）
// -> 回退到内置原创 SVG 立绘（渲染成 <svg>，没有内联 <img>）。
// 注意：账户头像走的是**远程 URL**（getProfile().avatarUrl），属于合理存在的 <img>，
// 不能拿它来判定"素材是否内联"，所以这里按 src 类型分开统计。
const svgFallback = findSvg(openTree, [])
const inlined = imgs.filter((p) => String(p.src || '').startsWith('data:'))
const remoteImgs = imgs.filter((p) => /^https?:\/\//.test(String(p.src || '')))
const badInline = inlined.filter((p) => !/^data:image\//.test(String(p.src || '')))
if (badInline.length) fail('内联图片不是 data:image URI: ' + String(badInline[0].src).slice(0, 40))
if (inlined.length) {
  ok('折叠态 ' + showBtns.length + ' 个按钮 -> 展开态成功，含内联 <img>')
  ok('形象秀立绘已内联: ' + (String(inlined[0].src).length / 1024).toFixed(1) + ' KB data URI')
} else {
  if (!svgFallback.length) fail('既没有内联素材、也没有 SVG 兜底立绘 —— 面板会渲染成空白')
  ok('干净版/公开版：非原创素材已剥离 -> 回退内置原创 SVG 立绘（' + svgFallback.length + ' 个 svg 节点）')
}
if (remoteImgs.length) ok('账户头像走远程 URL（' + remoteImgs.length + ' 个 <img>），不计入内联素材')

// 三段小节头必须都在，且都是真交互（点击开合）
const secTxt = collectText(openTree, []).join(' | ')
for (const t of ['对方形象', '个人空间', '我的形象']) {
  if (!secTxt.includes(t)) fail('IM 右侧列缺少小节「' + t + '」')
}
const secHeads = walk(openTree, []).filter((b) => {
  const tx = JSON.stringify(b.children || '')
  return tx.includes('对方形象') || tx.includes('个人空间') || tx.includes('我的形象')
})
if (secHeads.length !== 3) fail('三个小节头应都可点击（真交互），实得 ' + secHeads.length)
ok('三段面板: 对方形象 / 个人空间 / 我的形象（小节头均可点击开合）')
// 两张立绘必须占**完全相同的尺寸**（统一画框 + contain），否则长宽比不同高度会差很多
const figBoxes = []
const findFigBoxes = (n, d) => {
  const dd = d || 0
  if (!n || typeof n !== 'object' || dd > 12) return
  if (typeof n.type === 'function') { try { return findFigBoxes(instantiate(n.type, n.props), dd + 1) } catch (e) { return } }
  const st = n.props && n.props.style
  if (st && st.height === 168 && st.justifyContent === 'center') figBoxes.push(st)
  ;(n.children || []).forEach((c) => findFigBoxes(c, dd + 1))
}
findFigBoxes(openTree)
if (figBoxes.length !== 2) fail('两张立绘应共用同一固定画框，实得 ' + figBoxes.length + ' 个')
if (figBoxes[0].width !== figBoxes[1].width || figBoxes[0].height !== figBoxes[1].height) {
  fail('两张立绘的画框尺寸不一致')
}
const mineImgs = findImgs(openTree, []).filter((p) => p.alt === '我的形象')
if (!mineImgs.length) fail('「我的形象」没有渲染头像 <img>')
if (mineImgs[0].style.objectFit !== 'contain') fail('立绘图应 objectFit:contain 等比缩放')
ok('两张立绘尺寸一致（同一 168px 画框 + contain）')

// 「我的形象」必须被压在栏目最下方
const mineSec = []
const findMine = (n, d) => {
  const dd = d || 0
  if (!n || typeof n !== 'object' || dd > 12) return
  if (typeof n.type === 'function') { try { return findMine(instantiate(n.type, n.props), dd + 1) } catch (e) { return } }
  const st = n.props && n.props.style
  if (st && st.marginTop === 'auto') mineSec.push(st)
  ;(n.children || []).forEach((c) => findMine(c, dd + 1))
}
findMine(openTree)
if (!mineSec.length) fail('「我的形象」未固定在栏目最下方（缺少 marginTop:auto）')
ok('「我的形象」固定在栏目最下方（marginTop:auto）')
// 「我的形象」必须用整张头像图（不是小缩略图）—— 尺寸一致性在上面已断言。
// 干净版没有内联头像，此时应为 SVG 兜底（同样整张铺满同一个画框）。
if (mineImgs.length) {
  ok('「我的形象」使用用户头像图（' + (String(mineImgs[0].src).length / 1024).toFixed(1) + ' KB data URI）')
} else if (!svgFallback.length) {
  fail('「我的形象」既没有内联头像图、也没有 SVG 兜底 —— 会渲染成空白')
} else {
  ok('干净版：「我的形象」回退内置原创 SVG 企鹅')
}

// 「用户头像」= 账户头像（一方 getProfile 的 avatarUrl，与左下角圆形头像同源）
if (!ctx.__profileMeta) fail('未调用 ctx.remote.account.getProfile 取账户头像')
const mineImg = findImgs(openTree, []).find((p) => p.alt === '我的形象')
if (!mineImg) fail('「我的形象」没有图片')
if (!String(mineImg.src).includes('wechat-avatar.png')) {
  fail('「我的形象」未优先使用账户头像，实得 ' + String(mineImg.src).slice(0, 70))
}
if (typeof mineImg.onError !== 'function') fail('账户头像应带 onError，以便加载失败时回退内置头像')
ok('「我的形象」优先用账户头像（getProfile.avatarUrl），失败则回退内置图')

// 绿名 = **我的昵称**，不是账号名。
// 账号名（getProfile.name，测试里是「测试用户」）是登录身份，挂到聊天抬头会很怪 ——
// 用户明确反馈过"绿名恒为账户用户名，不是我"，这条断言就是这个 bug 的负向保护。
const ctlStyle2 = findStyles(render(regs.get('im2005-skin-control').comp), []).join('')
if (!ctlStyle2.includes(':root{--dsh-im-username:"我"}')) {
  fail('绿名未默认注入「我」，实得 style: ' + JSON.stringify(ctlStyle2.slice(-160)))
}
if (ctlStyle2.includes('测试用户')) {
  fail('绿名又用上账户名了 —— 用户要的是「我」/自己的昵称，不是账户用户名')
}
ok('绿名默认注入「我」（而非账户名）→ 消息抬头显示的是我，不是账号')
// 头像下面不能有任何文字（用户要求）
if (secTxt.includes('旧版界面') || secTxt.includes('档位 ')) {
  fail('「我的形象」头像下面仍有文字，实得: ' + secTxt)
}
ok('「我的形象」头像下方无文字')

// ---- 个人空间 = 账户区：不重复 + 全是真功能 ----
console.log('\n=== 6d. 个人空间：不重复的账户功能 ===')
for (const t of ['外观：', '字号', '查看用量', '充值']) {
  if (!secTxt.includes(t)) fail('个人空间缺少「' + t + '」，实得: ' + secTxt)
}
// 去重断言：余额在底部工具条、档位在顶栏与底部徽标行，这里不能再有
if (secTxt.includes('余额查询') || secTxt.includes('关闭余额')) fail('个人空间重复了「余额」（底部工具条已有）')
if (/皮肤\s*(关|标准|浓烈)/.test(secTxt)) fail('个人空间重复了「皮肤档位」（顶栏/底部已有）')
if (!secTxt.includes('测试用户')) fail('个人空间未显示账户身份（getProfile.name）')
ok('个人空间: 账户身份 + 外观 + 字号 + 用量/充值（与工具条零重复）')

// 三个真动作确实调到了对应的一方接口
const zoneBtns = walk(openTree, []).filter((b) => {
  const tx = JSON.stringify(b.children || '')
  return tx.includes('外观：') || tx.includes('字号') || tx.includes('查看用量') || tx.includes('充值')
})
if (zoneBtns.length < 4) fail('个人空间的真按钮应至少 4 个，实得 ' + zoneBtns.length)
const clickBy = (frag) => {
  const b = zoneBtns.find((x) => JSON.stringify(x.children || '').includes(frag))
  if (!b) fail('找不到按钮: ' + frag)
  b.props.onClick()
}
clickBy('外观：')
clickBy('字号 14 +')
clickBy('查看用量')
clickBy('充值')
if (!themeCalls.length) fail('「外观」未调用 ctx.theme.setTheme')
if (!fontCalls.length) fail('「字号 +」未调用 ctx.theme.setFontSize')
if (!openedUrls.includes('https://example.invalid/usage')) fail('「查看用量」未打开官方用量页')
if (!openedUrls.includes('https://example.invalid/topup')) fail('「充值」未打开官方充值页')
if (themeCalls.some((id) => ['light', 'dark', 'system'].indexOf(id) < 0)) {
  fail('setTheme 收到了非法 id: ' + JSON.stringify(themeCalls))
}
if (fontCalls.some((px) => !Number.isInteger(px) || px < 10 || px > 22)) {
  fail('setFontSize 收到越界值（应 10..22 整数）: ' + JSON.stringify(fontCalls))
}
ok('真动作已接通: setTheme(' + themeCalls.join(',') + ') · setFontSize(' + fontCalls.join(',') + ') · 打开 2 个官方链接')

// ---- 个人空间 剩余空间 = 自由编辑的任务清单/提醒栏 ----
const todoEl = (function findTodo(n, d) {
  const dd = d || 0
  if (!n || typeof n !== 'object' || dd > 12) return null
  if (typeof n.type === 'function') { try { return findTodo(instantiate(n.type, n.props), dd + 1) } catch (e) { return null } }
  if (n.type === 'textarea') return n
  for (const c of (n.children || [])) { const r = findTodo(c, dd + 1); if (r) return r }
  return null
})(openTree)
if (!todoEl) fail('个人空间 缺少自由编辑的任务清单（textarea）')
if (todoEl.props.style.pointerEvents !== 'auto') fail('任务清单必须 pointerEvents:auto（容器是 none，否则点不进去）')
if (String(todoEl.props.style.flex).indexOf('1 1') !== 0) fail('任务清单应 flex:1 长满 个人空间 的剩余空间')
if (!todoEl.props.placeholder) fail('任务清单缺少 placeholder 提示')
// 输入 → 落盘 localStorage（key 稳定，便于以后迁移）
todoEl.props.onChange({ target: { value: '任务A\n任务B' } })
const savedTodo = globalThis.window.localStorage.__dump
  ? globalThis.window.localStorage.__dump('dsh-skin-im2005.todo')
  : globalThis.window.localStorage.getItem('dsh-skin-im2005.todo')
if (savedTodo !== '任务A\n任务B') fail('任务清单内容未写入 localStorage，实得: ' + JSON.stringify(savedTodo))
ok('个人空间 剩余空间 = 自由编辑任务清单（flex:1 长满 + 输入即存 localStorage）')
// 注：个人空间**故意不含**余额/档位（去重要求），改由 6d 断言其账户功能

console.log('\n=== 6b. 品牌徽标（内联 PNG 或原创 SVG 兜底）===')
const brandTree = render(regs.get('im2005-brand').comp)
const brandImgs = findImgs(brandTree, [])
if (brandImgs.length) {
  // 形态①：有内联企鹅 PNG
  const pSrc = String(brandImgs[0].src || '')
  if (!pSrc.startsWith('data:image/png')) fail('企鹅不是 PNG data URI: ' + pSrc.slice(0, 40))
  ok('企鹅图标已内联: ' + (pSrc.length / 1024).toFixed(1) + ' KB data URI')
  const pStyle = brandImgs[0].style || {}
  if (pStyle.objectFit !== 'contain') fail('企鹅应使用 objectFit:contain 以免方形拉伸变形')
} else {
  // 形态②：公开版/干净版没有内联图 -> 必须回退到原创 SVG 徽标，不能是空的
  const brandSvg = findSvg(brandTree, [])
  if (!brandSvg.length) fail('品牌徽标既没有内联 PNG、也没有 SVG 兜底 —— 会渲染成空白')
  ok('品牌徽标走原创 SVG 兜底（' + brandSvg.length + ' 个 svg 节点）')
}

console.log('\n=== 6c. 侧栏档案卡：头像 / 在线 / 太阳 / 个性签名 ===')
const cardTree = render(regs.get('im2005-profile').comp)
const cardTxt = collectText(cardTree, []).join(' | ')
if (!cardTxt.includes('在线')) fail('档案卡缺少在线状态，实得: ' + cardTxt)
if (cardTxt.includes('旧版界面')) fail('档案卡不应再出现默认填充文字「旧版界面」，实得: ' + cardTxt)
if (!cardTxt.includes('+ 签名')) fail('空签名时应显示淡色占位提示，实得: ' + cardTxt)
// 用户要求：签名前不再显示「个性签名：」前缀
if (cardTxt.includes('个性签名')) fail('签名前缀「个性签名：」应已去掉，实得: ' + cardTxt)
// 用户要求：去掉头像右边的「IM2005 · 档位」那行
if (cardTxt.includes('IM2005 · ')) fail('档案卡仍显示「IM2005 · 档位」那行，实得: ' + cardTxt)
const cardImgs = findImgs(cardTree, [])
// 档案卡头像同样有两种形态：内联 PNG，或（公开版/干净版）原创 SVG 兜底。
// 但无论哪种，都必须**填满那个固定 50×50 的框**。
let cardAvatar = null            // 填框的那个元素（img 或 svg）
if (cardImgs.length) {
  if (!String(cardImgs[0].src).startsWith('data:image/png')) fail('头像不是 PNG data URI')
  cardAvatar = cardImgs[0]
} else {
  const cardSvg = findSvg(cardTree, [])
  if (!cardSvg.length) fail('档案卡既没有头像 <img>、也没有 SVG 兜底 —— 会渲染成空白')
  cardAvatar = cardSvg[0]
  ok('档案卡头像走原创 SVG 兜底（' + cardSvg.length + ' 个 svg 节点）')
}

// 头像框必须是固定尺寸（不随图片比例/加载状态变化）
const findAvFrame = (n, out, d) => {
  const dd = d || 0
  if (!n || typeof n !== 'object' || dd > 12) return out
  if (typeof n.type === 'function') { try { return findAvFrame(instantiate(n.type, n.props), out, dd + 1) } catch (e) { return out } }
  const st = n.props && n.props.style
  if (st && st.width === 50 && st.height === 50 && st.overflow === 'hidden') out.push(st)
  ;(n.children || []).forEach((c) => findAvFrame(c, out, dd + 1))
  return out
}
const frames = findAvFrame(cardTree, [])
if (!frames.length) fail('头像框不是固定 50×50 + overflow:hidden')
// 头像内容必须填满那个框：<img> 用 width:100%，
// SVG 兜底把尺寸写在**属性**上（width/height），两种都接受。
{
  const avStyle = cardAvatar.style || {}
  const fillByStyle = String(avStyle.width) === '100%'
  const fillByAttr = Number(cardAvatar.width) > 0 && Number(cardAvatar.height) > 0
  if (!fillByStyle && !fillByAttr) {
    fail('头像既没有 width:100% 也没有显式尺寸，无法填满固定框')
  }
}

// 卡片本体：浮层 + 点击穿透（只有签名可点）
const cardEl = (function findCard(n, d) {
  const dd = d || 0
  if (!n || typeof n !== 'object' || dd > 12) return null
  if (typeof n.type === 'function') { try { return findCard(instantiate(n.type, n.props), dd + 1) } catch (e) { return null } }
  if (n.props && n.props.className === 'dsh-skin-im2005-profile') return n
  for (const c of (n.children || [])) { const r = findCard(c, dd + 1); if (r) return r }
  return null
})(cardTree)
if (!cardEl) fail('找不到档案卡容器')
const cs = cardEl.props.style
if (cs.position !== 'fixed') fail('档案卡必须是浮层（position:fixed），实得 ' + cs.position)
if (cs.height !== 92) fail('档案卡高度应与 PROFILE_CARD_H(92) 一致，实得 ' + cs.height)
if (cs.pointerEvents !== 'none') fail('卡片容器应点击穿透（pointerEvents:none）')
ok('档案卡: 浮层 fixed + 高 92（与下推高度一致）+ 点击穿透')
ok('档案卡: 固定 50×50 头像框 + 在线 + 太阳 + 签名（无前缀、无 IM2005 行）')

// 太阳等级图标：3 个 svg（每个 8 条光芒 + 1 个圆）
const countSvg = (n, out, d) => {
  const dd = d || 0
  if (!n || typeof n !== 'object' || dd > 12) return out
  if (typeof n.type === 'function') { try { return countSvg(instantiate(n.type, n.props), out, dd + 1) } catch (e) { return out } }
  if (n.type === 'svg' && Array.isArray(n.children) && n.children.length > 4) out.push(n.children.length)
  ;(n.children || []).forEach((c) => countSvg(c, out, dd + 1))
  return out
}
const suns = countSvg(cardTree, [])
if (suns.length < 3) fail('应渲染 3 个太阳图标，实得 ' + suns.length)
ok('太阳等级图标: ' + suns.length + ' 个（每个 ' + suns[0] + ' 个子元素）')

// 点击签名 -> 输入 -> 回车保存进 localStorage
const sigNode = walk(cardTree, []).find((b) => JSON.stringify(b.children || '').includes('+ 签名'))
if (!sigNode) fail('找不到可点击的个性签名')
sigNode.props.onClick()
const editTree = render(regs.get('im2005-profile').comp)
const inputs = []
const findInputs = (n, out, d) => {
  const dd = d || 0
  if (!n || typeof n !== 'object' || dd > 12) return out
  if (typeof n.type === 'function') { try { return findInputs(instantiate(n.type, n.props), out, dd + 1) } catch (e) { return out } }
  if (n.type === 'input') out.push(n)
  ;(n.children || []).forEach((c) => findInputs(c, out, dd + 1))
  return out
}
const inputEl = findInputs(editTree, [])[0]
if (!inputEl) fail('点击签名后没有出现输入框')
inputEl.props.onKeyDown({ key: 'Enter', target: { value: '  你好 IM2005  ' } })
const saved = lsData.get('dsh-skin-im2005.signature')
if (saved !== '你好 IM2005') fail('签名未按预期存盘，实得: ' + JSON.stringify(saved))
const afterTree = render(regs.get('im2005-profile').comp)
if (!collectText(afterTree, []).join('|').includes('你好 IM2005')) fail('保存后档案卡未显示新签名')
ok('个性签名可编辑并持久化: localStorage["dsh-skin-im2005.signature"] = ' + JSON.stringify(saved))

// ---- 绿名（聊天抬头显示的名字）：默认「我」，可在 个人空间 里改，且与账号名无关 ----
{
  const nickNode = walk(render(showComp), []).find((b) => JSON.stringify(b.children || '').includes('昵称：'))
  if (!nickNode) fail('个人空间 里找不到昵称编辑入口（绿名的唯一编辑入口）')
  if (!JSON.stringify(nickNode.children || '').includes('昵称：我')) {
    fail('昵称默认应为「我」，实得 ' + JSON.stringify(nickNode.children))
  }
  nickNode.props.onClick()                                   // -> 出现输入框
  const nickInput = findInputs(render(showComp), [])[0]
  if (!nickInput) fail('点击昵称后没有出现输入框')
  nickInput.props.onKeyDown({ key: 'Enter', target: { value: '  小叶子  ' } })
  const savedNick = lsData.get('dsh-skin-im2005.nickname')
  if (savedNick !== '小叶子') fail('昵称未按预期存盘，实得 ' + JSON.stringify(savedNick))
  // 存盘后立刻反映到注入的 CSS 变量（消息抬头的绿名就是它）
  const nickCss = findStyles(render(regs.get('im2005-skin-control').comp), []).join('')
  if (!nickCss.includes(':root{--dsh-im-username:"小叶子"}')) {
    fail('改完昵称后注入的绿名没跟着变，实得 ' + JSON.stringify(nickCss.slice(-140)))
  }
  // 清空 = 回到「我」，不会留下空名字
  walk(render(showComp), []).find((b) => JSON.stringify(b.children || '').includes('昵称：')).props.onClick()
  findInputs(render(showComp), [])[0].props.onKeyDown({ key: 'Enter', target: { value: '   ' } })
  if (lsData.get('dsh-skin-im2005.nickname') !== '我') {
    fail('昵称留空应回落「我」，实得 ' + JSON.stringify(lsData.get('dsh-skin-im2005.nickname')))
  }
  ok('绿名可编辑并持久化，留空回落「我」: localStorage["dsh-skin-im2005.nickname"]')
}

// ---- 不变式：整列/整卡容器是 pointer-events:none，**每个可交互节点都必须自己打开 auto** ----
// 漏一个的症状就是"有图标但点不动"（昵称那一行就这么漏过一次：它是个 div，不是按钮，
// 所以"只数按钮"的老断言看不见它）。
{
  // 判定规则按 CSS 语义来：pointer-events **是继承属性**，所以一个节点只要能顺着一路
  // auto 的祖先被命中就算合格。起点是"容器是 none"（浮窗/整列都是这样）。
  //
  // ⚠️ 这里必须把**所有**交互性处理器都算上，不能只认 onClick —— 球桌标题栏用的是
  // onPointerDown（拖动），只查 onClick 就会漏掉"能拖却点不到按钮"这种坑。
  const HANDLERS = ['onClick', 'onPointerDown', 'onPointerMove', 'onPointerUp', 'onMouseDown', 'onMouseMove', 'onMouseUp']
  const auditVisit = (n, inheritedAuto, collect, d) => {
    const dd = d || 0
    if (!n || typeof n !== 'object' || dd > 14) return
    if (typeof n.type === 'function') {
      try { return auditVisit(instantiate(n.type, n.props), inheritedAuto, collect, dd + 1) } catch (e) { return }
    }
    const st = (n.props && n.props.style) || {}
    const pe = st.pointerEvents
    const auto = pe === 'auto' ? true : pe === 'none' ? false : inheritedAuto
    const p = n.props || {}
    const isField = n.type === 'input' || n.type === 'textarea'
    const hasHandler = HANDLERS.some((k) => typeof p[k] === 'function')
    if (hasHandler || isField) collect.push({ tag: String(n.type), auto, inherited: pe === undefined })
    ;(n.children || []).forEach((c) => auditVisit(c, auto, collect, dd + 1))
  }
  const audit = (label, root, minCount) => {
    const interactive = []
    auditVisit(root, false, interactive, 0)
    const bad = interactive.filter((x) => !x.auto)
    if (interactive.length < (minCount || 1)) {
      fail(label + ' 里可交互元素太少（' + interactive.length + ' 个），测试可能没渲染到实际内容')
    }
    if (bad.length) {
      fail(label + ' 里有可交互节点收不到指针事件（点了/拖了会没反应）: ' + JSON.stringify(bad.slice(0, 5)))
    }
    ok(label + ': ' + interactive.length + ' 个可交互节点都可被命中')
  }
  audit('形象秀列（容器 none）', render(showComp), 3)
  audit('侧栏档案卡（容器 none）', render(regs.get('im2005-profile').comp), 1)
}

// hook 状态按内层组件存储，所以要取到边界里面那个组件再删
const profileBoundary = regs.get('im2005-profile').comp
const innerProfile = render(profileBoundary).type

// 失焦必须取消（不写盘）—— 否则误点一下就把草稿存进去，之后再改默认值也删不掉
lsData.delete('dsh-skin-im2005.signature')
stateMap.delete(innerProfile)                      // 模拟重新挂载（重读 localStorage）
const card2 = render(profileBoundary)
const sigNode2 = walk(card2, []).find((b) => JSON.stringify(b.children || '').includes('+ 签名'))
if (!sigNode2) fail('清空签名后应回到「+ 签名」占位')
sigNode2.props.onClick()
const input2 = findInputs(render(regs.get('im2005-profile').comp), [])[0]
input2.props.onChange({ target: { value: '不该被保存' } })
input2.props.onBlur({ target: { value: '不该被保存' } })
if (lsData.has('dsh-skin-im2005.signature')) {
  fail('失焦不应写入 localStorage，实得: ' + JSON.stringify(lsData.get('dsh-skin-im2005.signature')))
}
ok('失焦 = 取消编辑，不写盘')

// 旧版填充默认值应被迁移清掉（用户反馈它就是那个突兀的 im2005···）
lsData.set('dsh-skin-im2005.signature', '旧版界面 · IM2005')
stateMap.delete(innerProfile)                      // 重新挂载，触发迁移
const card3 = render(profileBoundary)
if (collectText(card3, []).join('|').includes('旧版界面')) fail('旧默认值未被迁移清除')
if (lsData.has('dsh-skin-im2005.signature')) fail('迁移后 localStorage 仍残留旧默认值')
ok('旧默认填充值已迁移清除')

console.log('\n=== 6e. 顶栏那行字（用户指定）===')
const stripTxt = collectText(render(regs.get('im2005-strip').comp), []).join('')
if (!stripTxt.includes('与 DeepSeek Harness 聊天中...')) {
  fail('顶栏文字不是「与 DeepSeek Harness 聊天中...」，实得: ' + JSON.stringify(stripTxt))
}
if (stripTxt.includes('发送消息')) fail('顶栏仍在显示「发送消息」')
ok('顶栏文字: ' + JSON.stringify(stripTxt))

console.log('\n=== 7. 错误边界：我们的组件不能拖垮宿主 ===')
for (const [, id] of EXPECT) {
  const c = regs.get(id).comp
  if (!(c.prototype && typeof c.prototype.render === 'function')) fail(id + ' 未包错误边界（宿主可能被拖垮）')
  if (typeof c.getDerivedStateFromError !== 'function') fail(id + ' 边界缺少 getDerivedStateFromError')
}
ok(EXPECT.length + ' 个组件全部包了错误边界')
const B = regs.get('im2005-show').comp
const inst = new B({})
inst.state = { err: new Error('boom') }
const fallback = inst.render()
if (!fallback || fallback.type !== 'span') fail('边界在错误态没有渲染兜底元素')
ok('错误态兜底渲染正常: ' + JSON.stringify(fallback.children))

console.log('\n=== 8. 「皮肤 关」必须撤掉 chrome CSS（回到原生外观）===')
const dockBtn = walk(render(regs.get('im2005-skin-control').comp), []).find((b) => b.type === 'button')
dockBtn.props.onClick()                                            // 标准 -> 浓烈
walk(render(regs.get('im2005-skin-control').comp), []).find((b) => b.type === 'button').props.onClick()  // 浓烈 -> 关
const offCss = findStyles(render(regs.get('im2005-skin-control').comp), []).join('')
if (offCss.includes('[data-windows-titlebar]')) fail('皮肤关闭后仍注入 chrome CSS（顶部/侧栏仍会是蓝的）')
ok('皮肤关闭 -> chrome CSS 已撤掉')

console.log('\n=== 9. 提醒：只在任务完成时响 ===')
if (!HAS_NOTIFY) {
  // 公开版：提醒功能整块剥离 -> 必须零声音、零提醒存储键。
  // 注意：**观察器允许存在** —— 球桌的"任务完成提示"在两个版本都带，它自带一个极简观察器
  // （不是为了提醒功能），所以这里不能再拿"注册过 MutationObserver"当残留证据。
  if (fake.audioPlays !== 0 || fake.bursts !== 0) fail('无提醒功能的版本不该发出任何声音')
  if (lsData.has('dsh-skin-im2005.notify')) fail('无提醒功能的版本不该写提醒开关的存储键')
  ok('无提醒功能（公开版）-> 零声音、零提醒存储键（球桌提示自带观察器，不算残留）')
} else if (!fake.moCb) {
  fail('有提醒功能却没注册 MutationObserver —— 提醒没接上 DOM 信号')
} else {
  // 一次提醒 = 1 次 <audio> 播放（本地版有 mp3）或 2 个合成脉冲（干净版没有）
  const played = () => fake.audioPlays + fake.bursts / 2
  const realNow = Date.now
  let clock = 100000
  Date.now = () => clock
  // 观察器回调 -> 客户端用 setTimeout(sample, 16) 调度，所以这里要等它跑完
  const sample = async () => { fake.moCbs.forEach((cb) => cb()); await new Promise((r) => setTimeout(r, 25)) }
  try {
    // ① **打开界面时已经处于运行中** -> 随后恢复空闲，不该响。
    //    （夹具是在 import 之前把 running 置真的，所以插件注册观察器时的首帧采样就是"运行中"。）
    let base = played()
    fake.running = false; await sample()
    if (played() !== base) fail('启动时已在运行 -> 不该算任务完成（会每次打开都误响）')
    ok('启动时已在运行 -> 不响（陈旧状态不算完成）')

    // ② 空闲 -> 不响
    base = played()
    await sample(); await sample()
    if (played() !== base) fail('空闲状态不该响')
    ok('空闲不响')

    // ③ 任务完成：同一个会话里开始跑 -> 2 秒 -> 结束 -> 咳一声
    fake.running = true; await sample(); clock += 2000
    fake.running = false; await sample()
    if (played() - base !== 1) fail('任务完成应提醒一次，实得 ' + (played() - base))
    ok('任务完成 -> 提醒一次')

    // ④ **切走一个正在跑的会话 -> 不响（两种切法都要挡住）。**
    //    `[data-chat-running]` 挂在 `[data-conversation-session]` 容器里，切走会让它随容器
    //    一起卸载 —— 那是"切走了"，不是"跑完了"。不区分就会在每次切走时误咳一声。
    base = played()
    fake.running = true; await sample(); clock += 5000
    fake.scopeAlive = false; fake.running = false; await sample()       // 切法一：容器被换掉
    if (played() !== base) fail('切走（容器断开）不该算任务完成 —— 这正是"点开别的会话就咳"的根因')
    // 被规则拦下时也要在 tooltip 里留痕：万一没声音，悬停就知道是"没看到结束"还是"被拦了"
    {
      const t = String((walk(render(regs.get('im2005-toolbar').comp), [])[2] || {}).props?.title || '')
      if (!/上次事件：切走了正在跑的会话/.test(t)) {
        fail('被拦下的那次没有留下诊断记录，实得 ' + JSON.stringify(t))
      }
    }
    ok('切走正在跑的会话（容器断开）-> 不响（并在 tooltip 留下诊断）')

    base = played()
    fake.scopeAlive = true
    fake.running = true; await sample(); clock += 5000
    fake.session = 's2'; fake.running = false; await sample()           // 切法二：同一节点换了会话
    fake.session = 's1'
    if (played() !== base) fail('切走（同一容器换了会话 id）不该算任务完成')
    ok('切走正在跑的会话（容器复用、换了会话）-> 不响')

    // ⑤ 同一容器里它真的结束了 -> 必须响（别把真完成一起滤掉）
    base = played()
    fake.running = true; await sample()
    clock += 3000
    fake.running = false; await sample()
    if (played() - base !== 1) fail('同一容器内看到它结束应该响，实得 ' + (played() - base))
    ok('同一容器内看到它结束 -> 响')

    // ⑤b **拿不到容器时也必须响**（降级为"看到结束就提醒"，宁可多响也不要哑掉）
    base = played()
    fake.noScope = true
    fake.running = true; await sample(); clock += 3000
    fake.running = false; await sample()
    fake.noScope = false
    if (played() - base !== 1) fail('拿不到会话容器时应降级为照常提醒，实得 ' + (played() - base))
    ok('拿不到会话容器 -> 降级为照常提醒（不会哑掉）')

    // ⑥ **后台也要能响**：调度不能依赖 requestAnimationFrame（隐藏窗口里它完全不触发）。
    //    夹具把 rAF 换成"永不回调"，上面①②③本身就已经在验证这一点。
    if (fake.rafCalls !== 0) fail('调度又用上了 requestAnimationFrame（隐藏窗口里不会回调）')
    ok('调度不依赖 rAF -> 窗口在后台也能采样并提醒')

    // ⑦ 运行不足 1.2s 不响 —— 瞬时状态抖动不该咳
    base = played()
    fake.running = true; await sample(); clock += 300
    fake.running = false; await sample()
    if (played() !== base) fail('运行不足 1.2s 不该响')
    ok('运行 <1.2s 不响')

    // ⑧ 冷却期内的第二轮不响（防同一轮被计算两次 / 观察器注册两次）
    base = played()
    fake.running = true; await sample(); clock += 1300   // 够 minRun，但距上次提醒 <2s
    fake.running = false; await sample()
    if (played() !== base) fail('冷却期内的第二次结束不该响')
    clock += 1000                                         // 越过冷却
    fake.running = true; await sample(); clock += 1300
    fake.running = false; await sample()
    if (played() - base !== 1) fail('越过冷却后应恢复提醒，实得 ' + (played() - base))
    ok('冷却 2 秒：期内不连响，过后恢复')

    // ⑨ **待确认面板彻底不再被监听**（源码级断言 —— 那条误触发路径必须从代码里消失）。
    //    它原来会在每次切进"挂着面板的会话"时误响，用户要求只保留任务完成提醒。
    {
      const { readFileSync } = await import('node:fs')
      const src = readFileSync(file.replace('file:///', ''), 'utf8')
      // 先去掉注释：源码注释里会提到这几个属性名（解释"为什么不用它"），那不是代码
      const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '')
      if (/data-approval-key|data-question-key|data-plan-review-key/.test(code)) {
        fail('客户端又在监听待确认面板了 —— 切进挂着面板的会话会反复误触发')
      }
      ok('代码里完全不碰待确认面板（该误触发路径已消失）')
    }

    // ⑩ 开关：关掉后完全静音、状态落盘；再打开会试听一声
    const sndBtn = toolBtns[2]
    sndBtn.props.onClick()                                     // 关
    if (lsData.get('dsh-skin-im2005.notify') !== '0') fail('关闭开关未落盘，实得 ' + JSON.stringify(lsData.get('dsh-skin-im2005.notify')))
    base = played()
    fake.running = true; await sample(); clock += 2000
    fake.running = false; await sample()
    if (played() !== base) fail('关掉开关后仍然响了 ' + (played() - base) + ' 次')
    ok('开关关闭后完全静音（落盘 notify=0）')

    base = played()
    sndBtn.props.onClick()                                     // 开 -> 试听
    if (lsData.get('dsh-skin-im2005.notify') !== '1') fail('开启开关未落盘')
    if (played() - base !== 1) fail('开启时应试听一声')
    ok('重新开启 -> 试听一声 + 落盘 notify=1')

    // ⑪ 两条发声路径的互斥关系：有 mp3 就只能走 mp3，没 mp3 只能走合成。
    //    这是「公开版自动降级为合成音」这条承诺的负向断言 ——
    //    如果哪天 mp3 被误打进公开版、或合成音被误删、或两路叠加，这里都会红。
    if (fake.audioPlays > 0) {
      if (!/^data:audio\//.test(fake.audioSrc)) {
        fail('内联音频的 MIME 不对：' + fake.audioSrc.slice(0, 48) + ' —— <audio> 不会播')
      }
      if (fake.bursts !== 0) fail('有 mp3 时不该再叠加合成音（会响两声），实得 ' + fake.bursts + ' 个脉冲')
      ok('内联 mp3 存在 -> 只走 <audio>（MIME 正确），不叠加合成音')
    } else {
      if (fake.bursts === 0) fail('没有 mp3 却没走合成音 —— 公开版会彻底没声音')
      ok('无内联音频 -> 自动降级为现场合成的提醒声')
    }

    // ⑫ 按钮 tooltip 会写明上一次为什么响 —— 万一还误响，一眼能看出原因
    //    （必须重新渲染：tooltip 文案取自 store，第 5 节那次渲染还是空值）
    const sndTitle = String((walk(render(regs.get('im2005-toolbar').comp), [])[2] || {}).props?.title || '')
    if (!/上次提醒/.test(sndTitle)) fail('「提醒声」按钮没有记录上一次提醒原因，实得 ' + JSON.stringify(sndTitle))
    if (!/任务完成/.test(sndTitle)) fail('提示里没写清触发原因，实得 ' + JSON.stringify(sndTitle))
    ok('按钮 tooltip 记录上次提醒原因（万一误响可诊断）')
  } finally {
    Date.now = realNow
  }

  // 关掉插件时必须断开观察器，不能留悬空监听
  if (fake.disconnected < 0) fail('unreachable')
  ok('观察器已注册（dispose 时 disconnect）')
}

console.log('\n=== 10. 美式八球引擎：物理 + 规则 + 存档 ===')
{
  // 引擎通过槽位的 inject 露面 —— 测试走的就是宿主那条真实注入路径
  const pool = regs.get('im2005-pool').opts.inject()
  const P = pool.engine.POOL
  const mk = (o) => pool.engine.create(o)
  const POCKET_IN = [P.POCKET_INSET, P.POCKET_INSET]   // 已进袋的球放这里（restore 会校验坐标在台内）

  // 用一份合法存档"摆出"任意局面（引擎没有别的后门，restore 本身就是摆球工具）
  const layout = (spots, game) => {
    const balls = []
    for (let id = 0; id <= 15; id++) {
      const s = spots[id]
      balls.push(s
        ? { id, x: s[0], y: s[1], vx: 0, vy: 0, in: false, pocket: null }
        : { id, x: POCKET_IN[0], y: POCKET_IN[1], vx: 0, vy: 0, in: true, pocket: 0 })
    }
    const eng = mk()
    const okRestore = eng.restore({
      v: 1, ts: 1, finished: false, balls,
      game: Object.assign({
        phase: 'assigned', turn: 0, groups: ['solid', 'stripe'], open: false,
        inHand: false, behindLine: false, called: null, shots: [0, 0], winner: null,
      }, game || {}),
      score: { wins: [0, 0], best: 0 },
    })
    if (!okRestore) fail('测试用局面 restore 失败 —— 摆球器的坐标或字段不合法')
    return eng
  }
  const energy = (s) => s.balls.reduce((a, b) => a + (b.in ? 0 : b.vx * b.vx + b.vy * b.vy), 0)
  const settle = (eng, maxFrames) => {
    let n = 0
    while (eng.state().moving && n < (maxFrames || 6000)) { eng.step(1 / 60); n++ }
    return !eng.state().moving
  }
  const overlapOf = (s) => {
    const live = s.balls.filter((b) => !b.in)
    for (let i = 0; i < live.length; i++) {
      for (let j = i + 1; j < live.length; j++) {
        const d = Math.hypot(live[i].x - live[j].x, live[i].y - live[j].y)
        if (d < 2 * P.R - 1e-6) return [live[i].id, live[j].id, Number(d.toFixed(4))]
      }
    }
    return null
  }

  // ① 建局
  const g0 = mk()
  const s0 = g0.snapshot()
  if (s0.balls.length !== 16) fail('应有 16 颗球，实得 ' + s0.balls.length)
  const ids = s0.balls.map((b) => b.id).slice().sort((a, b) => a - b)
  for (let i = 0; i < 16; i++) if (ids[i] !== i) fail('球号不齐: ' + JSON.stringify(ids))
  if (overlapOf(s0)) fail('摆球就重叠了: ' + JSON.stringify(overlapOf(s0)))
  const cue0 = s0.balls.filter((b) => b.id === 0)[0]
  if (cue0.x > P.W * P.HEAD_STRING + 1e-9) fail('开球时母球应在开球线后，实得 x=' + cue0.x)
  ok('建局：16 颗球号齐全、无重叠、母球在开球线后')

  // ② 满力开球：散开、动能归零、停稳、全在台内
  if (!g0.canShoot()) fail('开球前应该能出杆')
  if (!g0.shoot({ angle: 0, power: 1 })) fail('满力开球应被接受')
  const ePeak = energy(g0.snapshot())          // 出杆瞬间的动能
  if (!(ePeak > 0)) fail('出杆后母球应该在动')
  if (!settle(g0)) fail('开球后球应能停稳（固定步长 + 速度阈值，否则存档永远不触发）')
  const s1 = g0.snapshot()
  const e1 = energy(s1)
  if (!(e1 < ePeak)) fail('动能必须被摩擦吃掉：峰值 ' + ePeak + ' -> 停稳后 ' + e1)
  if (e1 !== 0) fail('停稳后动能应为 0，实得 ' + e1)
  let moved = 0
  for (const b of s1.balls) {
    if (b.in) continue
    if (b.x < -0.01 || b.x > P.W + 0.01 || b.y < -0.01 || b.y > P.H + 0.01) fail('球跑到台外: ' + JSON.stringify(b))
    const before = s0.balls.filter((x) => x.id === b.id)[0]
    if (Math.hypot(b.x - before.x, b.y - before.y) > 0.5) moved++
  }
  if (moved < 5) fail('满力开球应该把球打散，实际只动了 ' + moved + ' 颗')
  ok('满力开球：' + moved + ' 颗球被撞开、动能 → 0、全部留在台内')

  // ③ 静息后 step 不再改变任何东西（"停稳就停掉 rAF"的前提）
  const before3 = JSON.stringify(g0.snapshot().balls)
  for (let i = 0; i < 30; i++) g0.step(1 / 60)
  if (JSON.stringify(g0.snapshot().balls) !== before3) fail('静息后继续 step 不应再改变球位')
  ok('静息后 step 幂等（停稳即可停掉渲染循环）')

  // ④ 直球进袋 → 不犯规、继续出杆
  const a4 = layout({ 0: [50, 14], 3: [50, 11], 1: [90, 40] })
  if (!a4.shoot({ angle: -Math.PI / 2, power: 0.55 })) fail('直球应能出杆')
  settle(a4)
  const r4 = a4.state()
  const in4 = a4.snapshot().balls.filter((b) => b.id === 3)[0]
  if (!in4.in) fail('正对中袋的直球应该进袋，实际没进')
  if (r4.turn !== 0) fail('进自己组的球应继续出杆，实际换人了')
  if (r4.shots[0] !== 1) fail('杆数应记为 1，实得 ' + r4.shots[0])
  ok('直球进中袋 → 不计犯规、杆数 +1、继续出杆')

  // ⑤ 母球落袋 = 犯规 → 换人 + 自由球
  //    注意：无旋转模型下正面撞击母球几乎停死（等质量 +0.94 恢复系数，母球只剩 3% 速度），
  //    所以"跟着目标球一起进袋"打不出来 —— 直接用"母球自己滚进中袋"这个用例。
  const a5 = layout({ 0: [50, 12], 5: [80, 40], 1: [90, 45] })
  a5.shoot({ angle: -Math.PI / 2, power: 0.5 })
  const res5 = a5.settleNow().result
  const st5 = a5.state()
  if (!res5 || res5.kind !== 'foul') fail('母球落袋应判犯规，实得 ' + JSON.stringify(res5))
  if (res5.foul !== '母球落袋') fail('犯规原因应为母球落袋，实得 ' + res5.foul)
  if (st5.turn !== 1) fail('犯规后应换人，实得 ' + st5.turn)
  if (!st5.inHand) fail('犯规后对手应拿到自由球')
  if (a5.snapshot().balls.filter((b) => b.id === 0)[0].in) fail('母球落袋后应被重新摆回台面')
  ok('母球落袋 → 犯规「母球落袋」、换人、自由球、母球重新上台')

  // ⑥ 空杆 = 犯规
  const a6 = layout({ 0: [20, 25], 1: [90, 40], 2: [90, 44] })
  a6.shoot({ angle: Math.PI / 2, power: 0.5 })
  const res6 = a6.settleNow().result
  if (!res6 || res6.foul !== '空杆：没碰到任何球') fail('空杆应判犯规，实得 ' + JSON.stringify(res6))
  ok('空杆（没碰到任何球）→ 犯规')

  // ⑥b **犯规但母球没落袋 → 母球必须留在原地**（自由球时玩家可以自己拖）。
  //     这条是用户实测报的 bug：原来犯规一律把母球摆回默认点，而"没球碰库"这类犯规
  //     对新手极其常见，体感就是"每次击球白球都回原位"。
  {
    const before = layout({ 0: [60, 30], 3: [90, 44], 1: [90, 40] })
    const cueBefore = before.snapshot().balls.filter((b) => b.id === 0)[0]
    // 往没有球的方向轻推：空杆犯规，母球撞库后停下 —— 全程没落袋
    if (!before.shoot({ angle: -Math.PI / 2, power: 0.35 })) fail('这一杆应能出杆')
    const r6b = before.settleNow().result
    if (!r6b || !r6b.foul) fail('这一杆应该判犯规（空杆），实得 ' + JSON.stringify(r6b))
    const cueAfter = before.snapshot().balls.filter((b) => b.id === 0)[0]
    if (cueAfter.in) fail('这一杆母球没落袋')
    if (Math.hypot(cueAfter.x - cueBefore.x, cueAfter.y - cueBefore.y) < 1) {
      fail('犯规后母球应留在它停下的位置，而不是被搬走')
    }
    if (Math.abs(cueAfter.x - 25) < 0.5 && Math.abs(cueAfter.y - 25) < 0.5) {
      fail('母球被摆回默认开球点（就是用户报的"每次击球白球都回原位"）')
    }
    if (!before.state().inHand) fail('犯规后对手应拿到自由球')
    ok('犯规但母球没落袋 → 母球留在原地（自由球可自己拖），不再飞回开球点')
  }

  // ⑦ 先碰对方的球 = 犯规
  const a7 = layout({ 0: [20, 25], 10: [40, 25], 1: [90, 45] })
  a7.shoot({ angle: 0, power: 0.6 })
  const res7 = a7.settleNow().result
  if (!res7 || res7.foul !== '先碰到了对方的球') fail('先碰对方球应判犯规，实得 ' + JSON.stringify(res7))
  ok('先碰到对方的球 → 犯规')

  // ⑧ 台面开放时先碰 8 号 = 犯规
  const a8 = layout({ 0: [20, 25], 8: [40, 25], 1: [90, 45] }, { phase: 'open', groups: [null, null], open: true })
  a8.shoot({ angle: 0, power: 0.6 })
  const res8 = a8.settleNow().result
  if (!res8 || res8.foul !== '台面开放时不能先碰 8 号球') fail('开放台面先碰 8 号应判犯规，实得 ' + JSON.stringify(res8))
  ok('台面开放时先碰 8 号球 → 犯规')

  // ⑨ 开球后第一次合法进球定组
  const a9 = layout({ 0: [50, 14], 3: [50, 11], 12: [90, 40] }, { phase: 'open', groups: [null, null], open: true })
  a9.shoot({ angle: -Math.PI / 2, power: 0.55 })
  settle(a9)
  const st9 = a9.state()
  if (st9.groups[0] !== 'solid' || st9.groups[1] !== 'stripe') fail('进 3 号（全色）应把全色分给玩家1，实得 ' + JSON.stringify(st9.groups))
  if (st9.open !== false || st9.phase !== 'assigned') fail('定组后台面应关闭，实得 ' + st9.phase + '/open=' + st9.open)
  ok('开球后第一次合法进球 → 定组（进 3 号 = 全色，对手拿花色）')

  // ⑩ 8 号球：**不用叫袋**（用户 2026-03-10 要求取消该规则）—— 合法进袋即胜；
  //    提前进（自己组还有球）→ 负；进袋同时犯规 → 负
  const eightLayout = { 0: [50, 14], 8: [50, 11] }   // 自己组的球全进袋 → 只剩 8 号
  const w1 = layout(eightLayout)
  if (!w1.shoot({ angle: -Math.PI / 2, power: 0.55 })) fail('打 8 号不叫袋也应该能出杆')
  settle(w1)
  if (w1.state().phase !== 'over' || w1.state().winner !== 0) fail('清完自己组打进 8 号应获胜，实得 ' + JSON.stringify(w1.state()))
  if (w1.snapshot().score.wins[0] !== 1) fail('获胜应记进比分')
  ok('8 号球：不用叫袋，合法进袋即胜（并记分）')

  // 取消叫袋后，"进哪个袋"不再影响胜负 —— 同一个局面朝另一个袋打进去也应该赢
  const w2 = layout({ 0: [50, 14], 8: [50, 11] })
  if (!w2.shoot({ angle: -Math.PI / 2, power: 0.55 })) fail('应能出杆')
  settle(w2)
  if (w2.state().winner !== 0) fail('不用叫袋时进任意袋都应算赢，实得 winner=' + w2.state().winner)
  ok('8 号球：任意袋都算（不再有"叫错袋判负"）')

  const w3 = layout({ 0: [50, 14], 8: [50, 11], 3: [90, 44] })   // 自己组还有球 → 提前进 8 号
  w3.shoot({ angle: -Math.PI / 2, power: 0.55 })
  settle(w3)
  if (w3.state().winner !== 1) fail('提前打进 8 号应判负，实得 winner=' + w3.state().winner)
  ok('提前打进 8 号球 → 判负')

  // ⑪ 存档往返 + 确定性：恢复后打同一杆，逐球坐标必须完全一致
  const a11 = layout({ 0: [30, 25], 1: [55, 20], 9: [70, 30], 8: [85, 25] })
  a11.settleNow()
  const saved = a11.serialize()
  const b11 = mk()
  if (!b11.restore(JSON.parse(JSON.stringify(saved)))) fail('合法存档应能恢复')
  a11.shoot({ angle: 0.42, power: 0.85 })
  b11.shoot({ angle: 0.42, power: 0.85 })
  for (let i = 0; i < 150; i++) { a11.step(1 / 60); b11.step(1 / 60) }
  const pa = a11.snapshot().balls
  const pb = b11.snapshot().balls
  for (let i = 0; i < pa.length; i++) {
    if (Math.abs(pa[i].x - pb[i].x) > 1e-9 || Math.abs(pa[i].y - pb[i].y) > 1e-9) {
      fail('存档恢复后打同一杆，结果必须逐球一致；球 ' + pa[i].id + ' 差了 ' + Math.abs(pa[i].x - pb[i].x))
    }
  }
  ok('存档恢复后重打同一杆 → 逐球坐标完全一致（确定性）')

  // ⑫ 坏存档一律拒绝（宁开新局，不灌脏数据）
  {
    const good = a11.serialize()
    const bad = [
      ['null', null],
      ['空对象', {}],
      ['版本不符', Object.assign(JSON.parse(JSON.stringify(good)), { v: 2 })],
      ['球数不对', Object.assign(JSON.parse(JSON.stringify(good)), { balls: good.balls.slice(0, 15) })],
      ['坐标是 NaN', (() => { const o = JSON.parse(JSON.stringify(good)); o.balls[3].x = NaN; return o })()],
      ['坐标越界', (() => { const o = JSON.parse(JSON.stringify(good)); o.balls[3].x = 9999; return o })()],
      ['球号重复', (() => { const o = JSON.parse(JSON.stringify(good)); o.balls[1].id = o.balls[0].id; return o })()],
      ['回合不是 0/1', (() => { const o = JSON.parse(JSON.stringify(good)); o.game.turn = 7; return o })()],
      ['阶段不存在', (() => { const o = JSON.parse(JSON.stringify(good)); o.game.phase = 'wat'; return o })()],
      ['速度离谱', (() => { const o = JSON.parse(JSON.stringify(good)); o.balls[2].vx = 1e6; return o })()],
    ]
    for (const [name, src] of bad) {
      const e = mk()
      if (e.restore(src)) fail('坏存档「' + name + '」应被拒绝，实际接受了')
    }
    // 存储层：JSON 坏了也必须当"没有存档"
    lsData.set('dsh-skin-im2005.pool', '{这不是 JSON')
    if (pool.save.read() !== null) fail('存储层读到坏 JSON 应返回 null')
    // 正常写入能读回来
    pool.save.write(good)
    const back = pool.save.read()
    if (!back || back.v !== 1 || back.balls.length !== 16) fail('存档写入后应能读回')
    pool.save.clear()
    if (pool.save.read() !== null) fail('clear 后应读不到存档')
    ok('坏存档 10 种形态全部拒绝；存储层坏 JSON 视为无存档；正常存档可写可读可清')
  }

  // ⑬ 自由球摆放的合法性
  {
    const a13 = layout({ 0: [20, 25], 3: [40, 25] })
    if (a13.place(60, 25)) fail('不是自由球时不该能挪母球')
    const a13b = layout({ 0: [20, 25], 3: [40, 25] }, { inHand: true })
    if (a13b.place(40, 25)) fail('母球不能摆到别的球身上')
    if (a13b.place(60, 25) !== true) fail('自由球应能摆到空位')
    if (a13b.place(-5, 25)) fail('母球不能摆出台外')
    const brk = layout({ 0: [20, 25], 3: [40, 25] }, { phase: 'break', inHand: true, behindLine: true })
    if (brk.place(60, 25)) fail('开球时必须把母球摆在开球线后')
    if (!brk.place(20, 30)) fail('开球时开球线后的空位应可摆')
    ok('自由球摆放：非法位置拒绝（压球 / 出台 / 开球越线），空位接受')
  }

  // ⑭ 瞄点预测
  {
    const a14 = layout({ 0: [20, 25], 4: [40, 25], 6: [42, 40] })
    const p14 = a14.predict(0)
    if (!p14 || p14.id !== 4) fail('正前方那颗球应被预测命中，实得 ' + JSON.stringify(p14))
    if (Math.abs(p14.dist - (20 - 2 * P.R)) > 0.01) fail('击点到球心的距离应为 d - 2R，实得 ' + p14.dist)
    const p14b = a14.predict(Math.PI / 2)
    if (!p14b || p14b.id !== -1) fail('向下没有球，应先撞库，实得 ' + JSON.stringify(p14b))
    ok('瞄点预测：命中正前方的球（含 2R 修正）、前方无球时返回撞库点')
  }

  // ⑮ 极端速度不穿模 + restore 归零
  {
    const o = a11.serialize()
    o.balls.filter((b) => b.id === 1)[0].vx = P.MAX_SPEED * 4
    const e15 = mk()
    if (!e15.restore(o)) fail('提速后的存档应仍合法')
    for (let i = 0; i < 600; i++) e15.step(1 / 60)
    for (const b of e15.snapshot().balls) {
      if (b.in) continue
      if (b.x < -0.01 || b.x > P.W + 0.01 || b.y < -0.01 || b.y > P.H + 0.01) fail('极端速度下球跑出台外: ' + JSON.stringify(b))
    }
    ok('极端速度（4 倍上限）推进 10 秒：所有球始终留在台内（不穿模）')
    if (e15.snapshot().balls.filter((b) => b.id === 1)[0].vx !== 0) fail('restore 应把速度归零')
    ok('restore 把速度归零（存档只落在静止态，恢复逻辑只需处理一种情况）')
  }

  // ⑯ 电脑选杆（纯函数：输入局面，输出 {angle,power,call}）
  {
    const cpu = pool.cpu
    const cpuCreate = pool.engine.create
    if (typeof cpu !== 'function') fail('inject 里应该有电脑选杆函数')

    // ① 有直球可打：挑自己组的球、力度合法、这一杆真能进
    const e1 = layout({ 0: [20, 25], 3: [40, 25], 12: [90, 45] })
    const s1 = cpu(e1, { rnd: () => 0.5, error: 0, create: mk })
    if (!s1) fail('有球可打时电脑应该能给出杆法')
    if (!/打 3 号/.test(s1.why)) fail('电脑应挑自己组（全色）的 3 号，实得 ' + s1.why)
    if (!(s1.power > 0.1 && s1.power <= 1)) fail('力度应在 (0.1,1]，实得 ' + s1.power)
    if (!e1.shoot({ angle: s1.angle, power: s1.power })) fail('电脑给出的杆法应被引擎接受')
    settle(e1)
    if (!e1.snapshot().balls.filter((b) => b.id === 3)[0].in) fail('电脑这一杆应该把 3 号打进中袋')
    ok('电脑选杆：挑自己组的球 → 杆法被引擎接受 → 3 号真的进袋')

    // ② 目标只可能是自己组的球，且这一杆不该犯规
    const e2 = layout({ 0: [20, 25], 3: [40, 25], 5: [80, 44], 12: [60, 42] })
    const s2 = cpu(e2, { rnd: () => 0.5, error: 0, create: mk })
    if (!/打 [35] 号/.test(s2.why)) fail('目标必须是自己组（全色 3/5）的球，实得 ' + s2.why)
    e2.shoot({ angle: s2.angle, power: s2.power })
    const r2 = e2.settleNow().result
    if (r2 && r2.foul) fail('这一杆不该犯规，实得 ' + r2.foul)
    ok('电脑选杆：只拿自己组的球当目标（' + s2.why + '），且这一杆不犯规')

    // ②b 全被挡死时走"轻碰目标球"的保底杆法 —— 会犯规，但比空杆强。
    //    翻袋（先撞库再碰球）是合法打法，本版不做：这条断言把已知局限钉住。
    const e2b = layout({ 0: [20, 25], 3: [50, 25], 12: [35, 25] })
    const s2b = cpu(e2b, { rnd: () => 0.5, error: 0, create: mk })
    if (!/没机会/.test(s2b.why)) fail('全被挡死时应走保底杆法，实得 ' + s2b.why)
    if (!e2b.shoot({ angle: s2b.angle, power: s2b.power })) fail('保底杆法也应被引擎接受')
    ok('电脑选杆：全被挡死 → 保底轻碰（已知局限：不做翻袋）')

    // ③ 该打 8 号时这一杆能赢 —— 局面用"母球正对 8 号与底袋"的直线球
    //    （直线球母球会停死，不吃自杀杆的风险；自杀杆由 ③b 专门验）
    const e3 = layout({ 0: [50, 25], 8: [50, 40] })
    const s3 = cpu(e3, { rnd: () => 0.5, error: 0, create: mk })
    if (!s3) fail('只剩 8 号时电脑也该出杆')
    if (!e3.shoot({ angle: s3.angle, power: s3.power })) fail('电脑的 8 号杆法应被接受')
    settle(e3)
    if (e3.state().phase !== 'over' || e3.state().winner !== 0) {
      fail('电脑打 8 号应该赢（叫对了袋），实得 ' + JSON.stringify({ w: e3.state().winner, p: e3.state().phase, m: e3.state().message }))
    }
    if (e3.snapshot().balls.filter((b) => b.id === 0)[0].in) fail('这一杆不该把母球也打进袋')
    ok('电脑选杆：打 8 号（' + s3.why + '）赢下这一局，母球没落袋')

    // ③b 自杀杆：母球与 8 号在长轴中线上时，纯几何会选中"球进了母球也进了"那条线。
    //     试打验证就是为它加的 —— 这一杆绝不能再把母球打落袋。
    const e3c = layout({ 0: [20, 25], 8: [40, 25] })
    const s3c = cpu(e3c, { rnd: () => 0.5, error: 0, create: mk })
    e3c.shoot({ angle: s3c.angle, power: s3c.power })
    const r3c = e3c.settleNow().result
    if (r3c && r3c.foul === '母球落袋') fail('电脑不该打出把母球也打落袋的杆法: ' + s3c.why)
    ok('电脑选杆：试打验证挡住自杀杆（' + s3c.why + '）')

    // ④ 台面开放时不能把 8 号当目标（先碰 8 号是犯规）
    const e4 = layout({ 0: [20, 25], 8: [40, 25], 3: [70, 40], 12: [70, 20] }, { phase: 'open', groups: [null, null], open: true })
    const s4 = cpu(e4, { rnd: () => 0.5, error: 0, create: mk })
    if (!s4) fail('台面开放时电脑也该有杆法')
    if (/打 8 号/.test(s4.why)) fail('台面开放时电脑不该拿 8 号当目标，实得 ' + s4.why)
    ok('电脑选杆：台面开放时避开 8 号球（' + s4.why + '）')

    // ⑤ 开球：满力、且引擎接受
    const e5 = mk()
    const s5 = cpu(e5, { rnd: () => 0.5, create: mk })
    if (!s5 || s5.power < 0.9) fail('开球应该满力，实得 ' + JSON.stringify(s5))
    if (!e5.shoot({ angle: s5.angle, power: s5.power })) fail('电脑开球应被引擎接受')
    ok('电脑选杆：开球满力（power=' + s5.power + '，' + s5.why + '）')

    // ⑥ 难度体现在瞄准误差上：error=0 与 error=0.05 的角度差要落在误差带内
    const e6 = layout({ 0: [20, 25], 3: [40, 25], 12: [90, 45] })
    const a0 = cpu(e6, { rnd: () => 1, error: 0, create: mk }).angle
    const a1 = cpu(e6, { rnd: () => 1, error: 0.05, create: mk }).angle
    if (Math.abs(a1 - a0) > 0.05 + 1e-9) fail('瞄准误差不该超过设定值，实得 ' + Math.abs(a1 - a0))
    if (Math.abs(a1 - a0) < 1e-6) fail('给了误差就应该偏一点（否则难度形同虚设）')
    ok('电脑选杆：难度 = 瞄准误差（error 内偏移，0 则完全准）')
  }

  // ⑰ 声音事件：引擎只报"撞了、多响"，音频代码全在 UI 侧（引擎保持纯逻辑）
  {
    const e17 = layout({ 0: [20, 25], 3: [40, 25], 1: [90, 44] })
    e17.takeEvents()
    if (!e17.shoot({ angle: 0, power: 0.7 })) fail('应能出杆')
    let sawBall = false
    let sawRail = false
    for (let i = 0; i < 900 && e17.state().moving; i++) {
      e17.step(1 / 60)
      for (const ev of e17.takeEvents()) {
        if (ev.t === 'ball' && ev.v > 0) sawBall = true
        if (ev.t === 'rail' && ev.v > 0) sawRail = true
      }
    }
    if (!sawBall) fail('球撞球应产生 ball 事件（音效靠它）')
    if (!sawRail) fail('球撞库应产生 rail 事件')
    ok('物理事件：球撞球 / 撞库都报强度（音量按它给）')

    const e17b = layout({ 0: [50, 15], 3: [50, 19] })
    e17b.takeEvents()
    if (!e17b.shoot({ angle: Math.PI / 2, power: 0.7 })) fail('应能出杆')
    let pot = null
    for (let i = 0; i < 1200 && e17b.state().moving; i++) {
      e17b.step(1 / 60)
      for (const ev of e17b.takeEvents()) if (ev.t === 'pot') pot = ev
    }
    if (!pot || pot.id !== 3) fail('落袋应产生 pot 事件并带球号，实得 ' + JSON.stringify(pot))
    ok('物理事件：落袋事件带球号（音效据此出声）')
  }

  // ⑱ 尺寸比例 —— 用户要求"上网找比例"，那就把比例变成可检验读数。
  //     真实口径：球径 2.25"（57.15 mm，全尺寸统一）；台面 9 尺 100"×50"、7 尺 bar box 78"×39"。
  //     9 尺台上球只占 2.25%，7 尺台上占 2.9%（视觉大 28%）—— 按后者画。
  {
    const ballRatio = (2 * P.R) / P.W
    const want = 2.25 / 78
    if (Math.abs(ballRatio - want) > 0.0006) {
      fail('球径/台长 应为 ' + want.toFixed(5) + '（7 尺台：2.25"/78"），实得 ' + ballRatio.toFixed(5))
    }
    const pocketRatio = P.POCKET_R / P.R
    if (Math.abs(pocketRatio - 1.875) > 0.02) {
      fail('袋口/球半径比要跟着球径同比例变，应约 1.875，实得 ' + pocketRatio.toFixed(3))
    }
    ok('尺寸比例：球径占台长 ' + (ballRatio * 100).toFixed(2) + '%（真实 7 尺台比例），袋/球比 ' + pocketRatio.toFixed(2))
  }
}

console.log('\n=== 11. 美式八球浮窗：渲染 / 拉杆出杆 / 存档 / 关窗续打 / 人机对战 ===')
{
  const pool = regs.get('im2005-pool').opts.inject()
  const V = pool.view
  const P = pool.engine.POOL
  const sx = (x) => V.rail + x * V.scale
  const POOL_WIN_W = V.winW
  const POOL_WIN_H = V.winH
  const sy = (y) => V.rail + y * V.scale

  const walkErrors = []
  const allNodes = (n, out, d) => {
    const dd = d || 0
    if (!n || typeof n !== 'object' || dd > 14) return out
    if (typeof n.type === 'function') {
      try { return allNodes(instantiate(n.type, n.props), out, dd + 1) } catch (e) {
        // 不能静默吞掉：渲染抛错会让"找不到节点"变成假绿
        walkErrors.push(String((e && e.message) || e))
        return out
      }
    }
    out.push(n)
    ;(n.children || []).forEach((c) => allNodes(c, out, dd + 1))
    return out
  }
  const textOf = (n, d) => {
    const dd = d || 0
    if (dd > 14 || n === null || n === undefined) return ''
    if (typeof n === 'string' || typeof n === 'number') return String(n)
    if (typeof n !== 'object') return ''
    if (typeof n.type === 'function') {
      try { return textOf(instantiate(n.type, n.props), dd + 1) } catch (e) { return '' }
    }
    let s = ''
    ;(n.children || []).forEach((c) => { s += ' ' + textOf(c, dd + 1) })
    return s
  }
  const tree = () => { const t = allNodes(instantiate(regs.get('im2005-pool').comp, pool), []); if (walkErrors.length) fail('球桌渲染抛错: ' + walkErrors[0]); return t }
  const btn = (label) => tree().find((n) => n.type === 'button' && textOf(n).trim() === label)
  const canvas = () => tree().find((n) => n.type === 'canvas')
  const poolWin = () => tree().find((n) => n.props && n.props.className === 'dsh-skin-im2005-pool')
  const toolBtn = (label) => walk(render(regs.get('im2005-toolbar').comp), [])
    .find((b) => JSON.stringify(b.children || '').includes(label))

  // 假 canvas：getContext 返回一个记录调用的 2d 上下文
  const mkCanvas = () => {
    const calls = { n: 0, rects: [] }
    const store2 = {}
    const g = new Proxy({}, {
      get: (t, k) => {
        if (k === 'createRadialGradient' || k === 'createLinearGradient') return () => ({ addColorStop: () => {} })
        if (k === 'measureText') return () => ({ width: 8 })
        // 力度条是靠 fillRect 画的 —— 记下参数，测试才能"看见"力度
        if (k === 'fillRect') return (x, y, w, h) => { calls.n++; calls.rects.push([x, y, w, h]) }
        if (k in store2) return store2[k]
        return () => { calls.n++ }
      },
      set: (t, k, v) => { store2[k] = v; return true },
    })
    const cv = {
      width: 0, height: 0, style: {}, __poolSized: false,
      getContext: () => g,
      getBoundingClientRect: () => ({ left: 0, top: 0, width: V.w, height: V.h }),
    }
    return { cv, calls }
  }

  // 写一份"上一局没打完"的存档（必须在组件第一次渲染之前 —— 恢复询问是在挂载时判定的）。
  // 局面刻意造成"只剩 8 号球"：这样能把"最后一颗球"的界面路径也走一遍（新的 8 号规则）。
  const craft = (game) => {
    const balls = []
    for (let id = 0; id <= 15; id++) {
      if (id === 0) balls.push({ id: 0, x: 20, y: 25, vx: 0, vy: 0, in: false, pocket: null })
      else if (id === 8) balls.push({ id: 8, x: 70, y: 40, vx: 0, vy: 0, in: false, pocket: null })
      else balls.push({ id, x: P.POCKET_INSET, y: P.POCKET_INSET, vx: 0, vy: 0, in: true, pocket: 0 })
    }
    return {
      v: 1, ts: Date.now(), finished: false, balls,
      game: Object.assign({
        phase: 'assigned', turn: 0, groups: ['solid', 'stripe'], open: false,
        inHand: false, behindLine: false, called: null, shots: [7, 5], winner: null,
      }, game || {}),
      score: { wins: [2, 3], best: 9 },
    }
  }
  pool.save.write(craft())

  // 关着的时候不该渲染任何东西
  if (tree().length !== 0) fail('球桌没打开时不应渲染任何节点，实得 ' + tree().length)
  ok('未打开球桌 → 不渲染任何节点（不占位、不拦点击）')

  // 打不开时按钮是开关；点开
  const pb = toolBtn('美式八球')
  if (!pb) fail('找不到「美式八球」按钮')
  pb.props.onClick()
  if (!canvas()) fail('点了「美式八球」按钮后应出现 canvas')
  if (!/上次那局还没打完/.test(textOf(instantiate(regs.get('im2005-pool').comp, pool)))) {
    fail('有未完成存档时应该先问"继续还是重开"')
  }
  ok('打开球桌 → 有未完成存档时弹出「继续打完 / 重新开局」')

  // 继续打完 → 局面来自存档（HUD 的杆数能验证）
  btn('继续打完').props.onClick()
  if (/上次那局还没打完/.test(textOf(instantiate(regs.get('im2005-pool').comp, pool)))) fail('点了继续后询问框应该消失')
  if (!/杆数 12/.test(textOf(instantiate(regs.get('im2005-pool').comp, pool)))) {
    fail('继续后台面应来自存档（杆数 7+5=12），实得：' + textOf(instantiate(regs.get('im2005-pool').comp, pool)).slice(0, 120))
  }
  ok('「继续打完」→ 局面从存档恢复（杆数 12、比分 2:3 都在）')

  // 窗口容器不挡聊天、canvas 可点
  const win = poolWin()
  if (!win) fail('找不到球桌窗口容器')
  if (win.props.style.pointerEvents !== 'none') fail('球桌窗口容器应是 pointerEvents:none（不能挡住聊天区）')
  const cvNode = canvas()
  if (cvNode.props.style.pointerEvents !== 'auto') fail('canvas 必须自己打开 pointerEvents:auto，否则点不动')
  const clickables = tree().filter((n) => (n.props && typeof n.props.onClick === 'function') || n.type === 'input')
  const badPe = clickables.filter((n) => !n.props.style || n.props.style.pointerEvents !== 'auto')
  if (badPe.length) fail('球桌里 ' + badPe.length + ' 个可交互节点没打开 pointerEvents:auto: ' + badPe.map((n) => n.type).join(','))
  ok('球桌窗口：容器 pointerEvents:none、canvas 与 ' + clickables.length + ' 个控件各自 auto')

  // 布局稳定性：HUD 行与提示行的**高度必须写死**。
  // 这两行内容长度差别很大（提示会从"自由球…"变成两三行的犯规原因，HUD 有 6 个元素），
  // 不锁高度就会换行 → 整个窗口高度变化 → 用户看到的"游戏界面在跳"。
  {
    const hudRow = tree().find((n) => n.props && n.props.className === 'dsh-skin-im2005-pool-hud')
    const tipRow = tree().find((n) => n.props && n.props.className === 'dsh-skin-im2005-pool-tip')
    if (!hudRow || !tipRow) fail('找不到 HUD / 提示行（布局稳定性的断言要有锚点）')
    const h = (n) => (n.props.style && n.props.style.height) || 0
    const of = (n) => (n.props.style && n.props.style.overflow) || ''
    if (!(h(hudRow) >= 20)) fail('HUD 行高度应写死，实得 ' + JSON.stringify(hudRow.props.style.height))
    if (!(h(tipRow) >= 30)) fail('提示行高度应写死（留两行），实得 ' + JSON.stringify(tipRow.props.style.height))
    if (of(hudRow) !== 'hidden' || of(tipRow) !== 'hidden') fail('两行都要 overflow:hidden，否则换行仍会撑高窗口')
    if (hudRow.props.style.whiteSpace !== 'nowrap') fail('HUD 行要 nowrap（它是单行信息条）')
    ok('布局稳定：HUD 行 ' + h(hudRow) + 'px、提示行 ' + h(tipRow) + 'px 都写死 + overflow:hidden（换行不再撑高窗口）')
  }

  // 标题栏是**拖动区**（onPointerDown）—— 它必须能被命中，否则拖不动；
  // 同时它不能把子按钮的点击吞掉（否则"缩小/关闭"点了没反应，用户实测过）。
  {
    const collect = []
    const HANDLERS = ['onClick', 'onPointerDown', 'onPointerMove', 'onPointerUp', 'onMouseDown', 'onMouseMove', 'onMouseUp']
    const visit = (n, inheritedAuto, d) => {
      const dd = d || 0
      if (!n || typeof n !== 'object' || dd > 14) return
      if (typeof n.type === 'function') {
        try { return visit(instantiate(n.type, n.props), inheritedAuto, dd + 1) } catch (e) { return }
      }
      const st = (n.props && n.props.style) || {}
      const pe = st.pointerEvents
      const auto = pe === 'auto' ? true : pe === 'none' ? false : inheritedAuto
      const p = n.props || {}
      if (HANDLERS.some((k) => typeof p[k] === 'function')) collect.push({ tag: String(n.type), auto, hasText: !!p.children })
      ;(n.children || []).forEach((c) => visit(c, auto, dd + 1))
    }
    visit(instantiate(regs.get('im2005-pool').comp, pool), false, 0)
    const dead = collect.filter((x) => !x.auto)
    if (dead.length) fail('球桌里有交互节点收不到指针事件（缩小/拖动会没反应）: ' + JSON.stringify(dead.slice(0, 5)))
    // 拖动区按下时如果落在子按钮/提示上，必须让位给它们的点击
    const title = tree().find((n) => n.props && typeof n.props.onPointerDown === 'function')
    if (!title) fail('找不到标题栏拖动区')
    let started = false
    title.props.onPointerDown({ clientX: 5, clientY: 5, target: { closest: (s) => (String(s).indexOf('button') >= 0 ? {} : null) }, currentTarget: { setPointerCapture: () => {} } })
    started = !!(title.props.style.cursor === 'move')
    // 用一个真按钮当 target 再按一次：应当**不**开始拖动（否则点击被吞）
    const titleHandlerSrc = String(title.props.onPointerDown)
    if (!/closest/.test(titleHandlerSrc)) fail('标题栏拖动没有排除子按钮/提示，会吞掉"缩小/关闭"的点击')
    ok('标题栏：拖动区可命中且不吞子按钮点击（缩小/关闭才点得动）')
  }

  // 挂上假 canvas；这一局"只剩 8 号球" —— 按新规则直接拉杆就能打（不用叫袋）
  const fake2 = mkCanvas()
  canvas().props.ref.current = fake2.cv
  canvas().props.onMouseMove({ clientX: sx(60), clientY: sy(25) })
  if (fake2.calls.n < 20) fail('鼠标移动后应触发重画，实得 2d 调用 ' + fake2.calls.n + ' 次')
  if (/先点一下要进的袋口|叫袋/.test(textOf(instantiate(regs.get('im2005-pool').comp, pool)))) {
    fail('打 8 号不再需要叫袋，界面不该再提示点袋口')
  }
  ok('打 8 号球 → 不再要求叫袋（提示里没有"点袋口"）（并已重画 ' + fake2.calls.n + ' 次）')

  // 一次拉杆就直接出杆（不再有"先点袋口"这一步）
  const before = fake2.calls.n
  canvas().props.onMouseDown({ clientX: sx(20), clientY: sy(25) })   // 按在母球外侧 → 方向 +x
  canvas().props.onMouseMove({ clientX: sx(2), clientY: sy(25) })    // 往后拉 18 单位 → 力度 ≈ 0.53
  canvas().props.onMouseUp()
  if (globalThis.rafQueue.length !== 1) fail('直接拉杆就该出杆，实得队列 ' + globalThis.rafQueue.length)
  ok('不叫袋直接拉杆 → 出杆被接受、动画循环启动')

  // 手动驱动循环直到停稳（等价于窗口在前台一帧帧跑）
  let ts = 1000
  let frames = 0
  while (globalThis.rafQueue.length && frames < 4000) {
    const fn = globalThis.rafQueue.shift()
    ts += 16.7
    fn(ts)
    frames++
  }
  if (globalThis.rafQueue.length) fail('循环没有停下来（球停稳后必须停止请求新帧）')
  if (frames < 10) fail('一杆应该跑很多帧，实得 ' + frames)
  if (fake2.calls.n <= before) fail('出杆过程中应有重画')
  ok('动画循环：出杆后驱动 ' + frames + ' 帧、停稳即停（不再请求新帧）')

  // ---- 音效：界面出杆要出声；开关必须真能静音 ----
  {
    // fake.bursts = 噪声脉冲（撞球、落袋），fake.tones = 振荡器（撞库、出杆）
    const sfxCount = () => fake.bursts + fake.tones
    if (sfxCount() <= 0) fail('界面里拉杆打出去应该听见声音（出杆/撞球/撞库/落袋），实得 0 次')
    // 按钮能切换开关
    btn('音效：开').props.onClick()
    if (!/音效：关/.test(textOf(instantiate(regs.get('im2005-pool').comp, pool)))) fail('点一下应切到「音效：关」')
    btn('音效：关').props.onClick()
    if (!/音效：开/.test(textOf(instantiate(regs.get('im2005-pool').comp, pool)))) fail('再点一下应切回「音效：开」')
    // 关掉音效 → 四个发声入口全部静音
    pool.sfx.set(false)
    const n0 = sfxCount()
    pool.sfx.clack(60)
    pool.sfx.rail(40)
    pool.sfx.cue()
    pool.sfx.pot()
    await new Promise((r) => setTimeout(r, 80))   // 排掉落袋那两下的延迟脉冲
    if (sfxCount() !== n0) fail('关掉音效后不该再发声，实得多出 ' + (sfxCount() - n0) + ' 次')
    // 打开 → 又能出声
    pool.sfx.set(true)
    pool.sfx.clack(60)
    if (sfxCount() === n0) fail('打开音效后撞球应该出声')
    ok('音效：界面出杆会出声、开关能完全静音（全部现场合成，零第三方素材）')
  }

  // 停稳后必须落盘，且存档永远落在静止态
  const sv = pool.save.read()
  if (!sv) fail('一杆停稳后应自动写存档')
  if (sv.balls.some((b) => b.vx !== 0 || b.vy !== 0)) fail('存档里不该有速度（只应落在静止态）')
  if (sv.game.shots[0] + sv.game.shots[1] !== 13) fail('存档里杆数应为 12+1=13，实得 ' + (sv.game.shots[0] + sv.game.shots[1]))
  if (!/存档|已收好/.test(String(toolBtn('美式八球').props.title || ''))) fail('按钮 tooltip 应显示存档状态')
  ok('停稳即自动存档（含杆数 13、速度归零）并在按钮 tooltip 上可见')

  // 最小化：画面收起但局面不丢
  btn('─').props.onClick()
  if (canvas()) fail('最小化后不该再渲染 canvas')
  if (!/美式八球/.test(textOf(instantiate(regs.get('im2005-pool').comp, pool)))) fail('最小化后标题栏应还在')
  btn('▣').props.onClick()
  if (!canvas()) fail('还原后 canvas 应回来')
  if (!/杆数 13/.test(textOf(render(regs.get('im2005-pool').comp)))) fail('最小化/还原不该丢杆数')
  ok('最小化成标题栏 → 局面保留；还原后台面照旧')

  // 「任务完成」提示：只有球桌开着时才闪，且不动窗口（3b）
  const before4 = poolWin()
  fake.running = true
  fake.moCbs.forEach((cb) => cb())
  await new Promise((r) => setTimeout(r, 25))
  fake.running = false
  fake.moCbs.forEach((cb) => cb())
  await new Promise((r) => setTimeout(r, 25))
  if (!/任务完成 · 回来看/.test(textOf(render(regs.get('im2005-pool').comp)))) {
    fail('AI 回复完成时球桌标题栏应闪一行提示')
  }
  if (canvas() === undefined) fail('提示不该把球桌收起来')
  if (poolWin().props.style.left !== before4.props.style.left) fail('提示不该移动窗口位置')
  ok('任务完成 → 只在标题栏闪提示（不动窗口、不收起球桌）')

  // 关窗 → 停渲染、存档还在；再开 → 不重复问，局面还在
  btn('✕').props.onClick()
  if (tree().length !== 0) fail('关闭后不该渲染任何节点')
  if (!pool.save.read()) fail('关闭后存档应还在')
  toolBtn('美式八球').props.onClick()
  if (!canvas()) fail('再次打开应能渲染')
  if (/上次那局还没打完/.test(textOf(render(regs.get('im2005-pool').comp)))) fail('本次会话里已经问过了，不该反复问')
  if (!/杆数 13/.test(textOf(render(regs.get('im2005-pool').comp)))) fail('再打开应还是同一局（杆数 13）')
  ok('关窗 → 停渲染但存档在；再开 → 同一局继续、不重复询问')

  // 标题栏拖动：位置改变并落盘
  const titleNode = tree().find((n) => n.props && typeof n.props.onPointerDown === 'function')
  if (!titleNode) fail('标题栏应可拖动（缺 onPointerDown）')
  const posBefore = JSON.parse(lsData.get('dsh-skin-im2005.poolpos') || 'null')
  titleNode.props.onPointerDown({ clientX: 100, clientY: 100, pointerId: 1, currentTarget: { setPointerCapture: () => {} } })
  titleNode.props.onPointerMove({ clientX: 300, clientY: 260 })
  titleNode.props.onPointerUp({})
  const posAfter = JSON.parse(lsData.get('dsh-skin-im2005.poolpos') || 'null')
  if (!posAfter || (posBefore && posAfter.x === posBefore.x && posAfter.y === posBefore.y)) fail('拖动后应把窗口位置落盘')
  ok('标题栏拖动 → 位置改变并写入 localStorage（下次打开在原位）')

  // 窗口**拖不丢**：浮层是渲染层 DOM，天生被应用窗口裁掉，插件也建不了独立窗口 ——
  // 所以位置必须硬夹取成"整窗留在视口内"。拖到天边也必须还看得见、还抓得回来。
  {
    const vw = globalThis.innerWidth || 1200
    const vh = globalThis.innerHeight || 800
    const winBox = () => {
      const w = poolWin()
      return { x: w.props.style.left, y: w.props.style.top }
    }
    const title = tree().find((n) => n.props && typeof n.props.onPointerDown === 'function')
    // 往右下拖出屏幕 10 倍
    title.props.onPointerDown({ clientX: 100, clientY: 100, pointerId: 1, currentTarget: { setPointerCapture: () => {} } })
    title.props.onPointerMove({ clientX: 5000, clientY: 5000 })
    title.props.onPointerUp({})
    const bottomRight = winBox()
    if (bottomRight.x + POOL_WIN_W > vw + 1 || bottomRight.y + POOL_WIN_H > vh + 1) {
      fail('往右下拖时整窗必须留在视口内，实得 ' + JSON.stringify(bottomRight))
    }
    // 往左上拖出屏幕
    title.props.onPointerDown({ clientX: 100, clientY: 100, pointerId: 1, currentTarget: { setPointerCapture: () => {} } })
    title.props.onPointerMove({ clientX: -5000, clientY: -5000 })
    title.props.onPointerUp({})
    const topLeft = winBox()
    if (topLeft.x < 0 || topLeft.y < 0) fail('往左上拖不该把窗口推出视口，实得 ' + JSON.stringify(topLeft))
    // 双击标题栏 → 回到默认位置（右下角），且落盘
    title.props.onDoubleClick({})
    const home = winBox()
    if (home.x + POOL_WIN_W > vw + 1 || home.y + POOL_WIN_H > vh + 1) fail('双击回位后也必须整窗可见，实得 ' + JSON.stringify(home))
    if (home.x === topLeft.x && home.y === topLeft.y) fail('双击标题栏应该把窗口挪回默认位置')
    ok('窗口拖不丢：整窗始终留在视口内（' + JSON.stringify(home) + '），双击标题栏回默认位置')
  }


  // ---- 人机对战：轮到电脑时它会自己算杆并出杆 ----
  // 夹具里 React.useEffect 默认不跑（否则 Clock 的 setInterval 会吊住进程），
  // 这里显式打开，并把 setInterval 打掉保险。
  {
    fake.runEffects = true
    const realSetInterval = globalThis.setInterval
    globalThis.setInterval = () => 0
    const txt = () => textOf(instantiate(regs.get('im2005-pool').comp, pool))
    if (!/对手：电脑/.test(txt())) fail('默认对手应是电脑')
    if (!/电脑/.test(txt())) fail('对手是电脑时回合提示里应写「电脑」')
    if (!/难度：普通/.test(txt())) fail('默认难度应是「普通」')
    btn('难度：普通').props.onClick()
    if (!/难度：困难/.test(txt())) fail('难度应该循环到「困难」')
    btn('难度：困难').props.onClick()
    if (!/难度：简单/.test(txt())) fail('难度应该循环到「简单」')
    btn('难度：简单').props.onClick()
    if (!/难度：普通/.test(txt())) fail('难度应该循环回「普通」')
    btn('对手：电脑').props.onClick()
    if (!/对手：双人/.test(txt())) fail('点一下应切到「双人」')
    btn('对手：双人').props.onClick()
    if (!/对手：电脑/.test(txt())) fail('再点一下应切回「电脑」')

    // 上一杆犯规已经把回合交给了电脑 —— 它应该在 ~700ms 后自己出杆
    globalThis.rafQueue.length = 0
    const saveBefore = pool.save.read()
    const shotsBefore = saveBefore ? saveBefore.game.shots[1] : 0
    await new Promise((r) => setTimeout(r, 1300))
    if (!globalThis.rafQueue.length) fail('轮到电脑时它应该自己出杆（应启动动画循环）')
    let ts2 = 50000
    let guard2 = 0
    while (globalThis.rafQueue.length && guard2 < 4000) {
      const fn = globalThis.rafQueue.shift()
      ts2 += 16.7
      fn(ts2)
      guard2++
    }
    const saveAfter = pool.save.read()
    if (!saveAfter || saveAfter.game.shots[1] <= shotsBefore) {
      fail('电脑出杆后杆数应记在它头上（' + shotsBefore + ' -> ' + (saveAfter && saveAfter.game.shots[1]) + '）')
    }
    globalThis.setInterval = realSetInterval
    fake.runEffects = false
    ok('人机对战：轮到电脑自己出杆（对手/难度可切；' + guard2 + ' 帧跑完它那一杆）')
  // 拖边缘改大小：统一缩放（球台比例恒定）、尺寸落盘、**改完还得能正常打球**
  {
    // 层级：球桌必须压在 IM 秀那套浮层之上（IM 秀用的是皮肤里的"最高层"常量 Z）
    if (!(V.z > V.skinZ)) fail('球桌 z-index 必须大于 IM 秀的 ' + V.skinZ + '，实得 ' + V.z)
    if (poolWin().props.style.zIndex !== V.z) fail('球桌容器应使用 V.z，实得 ' + poolWin().props.style.zIndex)
    ok('层级：球桌 z-index ' + V.z + ' > IM 秀 ' + V.skinZ + '（IM 栏目不再盖住球桌）')
    // 记下 k=1 时的基准装饰条高度（等一下按 K 等比验证，避免在测试里硬编码常量）
    const rowOf = (cls) => tree().find((n) => n.props && n.props.className === cls)
    const hud0 = rowOf('dsh-skin-im2005-pool-hud').props.style.height
    const tip0 = rowOf('dsh-skin-im2005-pool-tip').props.style.height
    const grips = tree().filter((n) => n.props && n.props.className === 'dsh-skin-im2005-pool-resize')
    if (grips.length !== 3) fail('应有 3 个缩放手柄（右下角/右边缘/下边缘），实得 ' + grips.length)
    if (grips.some((g) => !g.props.style || g.props.style.pointerEvents !== 'auto')) {
      fail('缩放手柄必须自己打开 pointerEvents:auto（外层容器是 none，且它是继承属性）')
    }
    // 先把窗口挪到左上角，免得"别撑出视口"的夹取影响这次缩放
    const title2 = tree().find((n) => n.props && typeof n.props.onPointerDown === 'function' && n.props.onPointerMove)
    title2.props.onPointerDown({ clientX: 100, clientY: 100, pointerId: 1, currentTarget: { setPointerCapture: () => {} } })
    title2.props.onPointerMove({ clientX: -900, clientY: -900 })
    title2.props.onPointerUp({})
    const home2 = { x: poolWin().props.style.left, y: poolWin().props.style.top }

    const cornerOf = () => tree().filter((n) => n.props && n.props.className === 'dsh-skin-im2005-pool-resize').find((g) => g.props.style.cursor === 'nwse-resize')
    if (!cornerOf()) fail('缺少右下角缩放手柄')
    const K = 1.4
    cornerOf().props.onPointerDown({ clientX: 0, clientY: 0, pointerId: 2, currentTarget: { setPointerCapture: () => {} } })
    cornerOf().props.onPointerMove({ clientX: home2.x + V.w * K, clientY: home2.y + V.h * K })
    cornerOf().props.onPointerUp({})
    const cvAfter = canvas()
    const sc2 = (parseFloat(cvAfter.props.style.width) - 2 * V.rail) / P.W
    if (Math.abs(sc2 - V.scale * K) > 0.02) {
      fail('拖到 ' + K + ' 倍后比例尺应为 ' + (V.scale * K).toFixed(3) + '，实得 ' + sc2.toFixed(3))
    }
    const stored = parseFloat(lsData.get('dsh-skin-im2005.poolsize'))
    if (Math.abs(stored - K) > 0.01) fail('窗口大小应落盘为 ' + K + '，实得 ' + lsData.get('dsh-skin-im2005.poolsize'))
    // 装饰条必须**等比**跟着缩：否则小窗时那几条又粗又挡界面（用户实测）
    {
      const hud1 = rowOf('dsh-skin-im2005-pool-hud').props.style.height
      const tip1 = rowOf('dsh-skin-im2005-pool-tip').props.style.height
      if (Math.abs(hud1 - Math.round(hud0 * K)) > 1) fail('HUD 高度应等比缩到 ' + Math.round(hud0 * K) + '，实得 ' + hud1)
      if (Math.abs(tip1 - Math.round(tip0 * K)) > 1) fail('提示行高度应等比缩到 ' + Math.round(tip0 * K) + '，实得 ' + tip1)
      const hudBtns = tree().filter((n) => n.type === 'button' && String(textOf(n)).indexOf('：') >= 0)
      if (hudBtns.length < 3) fail('HUD 里应有对手/难度/音效三个按钮，实得 ' + hudBtns.length)
      if (hudBtns.some((x) => x.props.style.flexShrink !== 0)) fail('HUD 按钮必须 flexShrink:0，否则窄窗会被裁掉')
      ok('缩放联动：装饰条等比缩放（HUD ' + hud0 + '→' + hud1 + 'px、提示 ' + tip0 + '→' + tip1 + 'px）、三个按钮不被裁')
    }
    // 画布位图必须马上等于 CSS 尺寸（原来要等下一次鼠标移动才重画 → 缩放后是拉伸的旧画面）
    if (Math.abs(fake2.cv.width - parseFloat(cvAfter.props.style.width)) > 1) {
      fail('缩放后画布位图应立刻等于 CSS 宽度，实得 ' + fake2.cv.width + ' vs ' + cvAfter.props.style.width)
    }
    // 跑在电脑局之后：如果那局已经分出胜负，先开一局新的，否则出杆会被拒绝
    const liveBtn = (label) => tree().find((n) => n && n.type === 'button' && String(textOf(n)).indexOf(label) >= 0)
    const again = liveBtn('再来一局')
    if (again) again.props.onClick()
    // 改完大小之后还得能正常打球：用**新的**比例尺换算屏幕坐标拉一杆
    const sx2 = (x) => V.rail + x * sc2
    const sy2 = (y) => V.rail + y * sc2
    const before3 = pool.save.read()
    const shotsBefore3 = before3 ? before3.game.shots[0] + before3.game.shots[1] : 0
    globalThis.rafQueue.length = 0
    // 每次交互都重取节点：React 处理器是每次渲染重建的，旧引用里带着过期的 over/askResume
    const cv3 = () => canvas()
    cv3().props.onMouseDown({ clientX: sx2(6), clientY: sy2(6) })
    cv3().props.onMouseMove({ clientX: sx2(6 + 13), clientY: sy2(6 + 13) })
    cv3().props.onMouseUp()
    if (globalThis.rafQueue.length !== 1) fail('缩放后拉杆应该照常出杆（实得队列 ' + globalThis.rafQueue.length + '）')
    let ts3 = 90000
    let guard3 = 0
    while (globalThis.rafQueue.length && guard3 < 4000) {
      const fn = globalThis.rafQueue.shift()
      ts3 += 16.7
      fn(ts3)
      guard3++
    }
    const after3 = pool.save.read()
    const shotsAfter3 = after3 ? after3.game.shots[0] + after3.game.shots[1] : 0
    if (shotsAfter3 <= shotsBefore3) fail('缩放后打的那一杆应该正常计入杆数（' + shotsBefore3 + ' -> ' + shotsAfter3 + '）')
    // 上下限夹取
    cornerOf().props.onPointerDown({ clientX: 0, clientY: 0, pointerId: 3, currentTarget: { setPointerCapture: () => {} } })
    cornerOf().props.onPointerMove({ clientX: home2.x + V.w * 10, clientY: home2.y + V.h * 10 })
    cornerOf().props.onPointerUp({})
    if (parseFloat(lsData.get('dsh-skin-im2005.poolsize')) > V.maxK + 0.001) fail('缩放不该超过上限 ' + V.maxK)
    cornerOf().props.onPointerDown({ clientX: 0, clientY: 0, pointerId: 4, currentTarget: { setPointerCapture: () => {} } })
    cornerOf().props.onPointerMove({ clientX: home2.x + V.w * 0.1, clientY: home2.y + V.h * 0.1 })
    cornerOf().props.onPointerUp({})
    if (parseFloat(lsData.get('dsh-skin-im2005.poolsize')) < V.minK - 0.001) fail('缩放不该低于下限 ' + V.minK)
    ok('拖边缘改大小：' + K + ' 倍生效并落盘、比例尺一致、改完照常出杆（' + guard3 + ' 帧）；上下限 [' + V.minK + ',' + V.maxK + '] 夹得住')
  }

  // 力度换算灵敏度：拖多远算满力（数值越小越灵敏）。
  // 读数直接取画布上画出来的力度条宽度 —— 不用给组件开测试后门。
  {
    const PULL = V.pullFull
    if (!(PULL > 0)) fail('应该有"满力拉动距离"常量 pullFull')
    if (PULL > P.W * 0.25) fail('满力拉动距离不该超过台长 1/4（灵敏度退化），实得 ' + PULL)
    const cvP = () => canvas()
    // 比例尺要按**当前**画布宽度反推：上面那块把窗口缩到过 0.6 倍，用 1 倍的比例尺会算错距离
    const scNow = (parseFloat(cvP().props.style.width) - 2 * V.rail) / P.W
    const px = (x) => V.rail + x * scNow
    const py = (y) => V.rail + y * scNow
    const bars = () => (fake2.calls.rects || []).filter((r) => r[3] === 9)
    const lastBar = () => { const rs = bars(); return rs.length ? rs[rs.length - 1][2] : -1 }
    const bgBar = () => { const rs = bars(); return rs.length >= 2 ? rs[rs.length - 2][2] : -1 }
    fake2.calls.rects.length = 0
    cvP().props.onMouseDown({ clientX: px(95), clientY: py(45) })
    cvP().props.onMouseMove({ clientX: px(95 - PULL / 2), clientY: py(45) })
    const half = lastBar()
    const bg = bgBar()
    cvP().props.onMouseMove({ clientX: px(95 - PULL), clientY: py(45) })
    const full = lastBar()
    cvP().props.onMouseUp()
    if (!(half > 0 && full > 0 && bg > 0)) fail('拉动过程中应该画出力度条，实得 half=' + half + ' full=' + full + ' bg=' + bg)
    if (Math.abs(full / half - 2) > 0.12) fail('力度条应随拉动距离线性变化（满力/半程 ≈ 2），实得 ' + (full / half).toFixed(2))
    if (Math.abs(full - bg) > 0.6) fail('拖满 ' + PULL + ' 单位应正好满力（力度条画满），实得 ' + full + ' / 底槽 ' + bg)
    ok('力度灵敏度：满力只需拉 ' + PULL + ' 单位（台长的 ' + (PULL / P.W * 100).toFixed(0) + '%），力度条线性、半程 ' + half.toFixed(0) + 'px / 满格 ' + full.toFixed(0) + 'px')
  }
  }
}


console.log('\n=== 12. 扫雷引擎（20×20）：首点安全 / 连锁 / 插旗 / 连开 / 胜负 / 存档 ===')
{
  const mineInj = regs.get('im2005-mine').opts.inject()
  const ME = mineInj.engine.MINE
  const mkMine = (opts) => mineInj.engine.create(opts)

  if (ME.W !== 20 || ME.H !== 20) fail('扫雷应是 20×20，实得 ' + ME.W + '×' + ME.H)
  if (ME.MINES.normal !== 80) fail('普通难度应是 80 雷，实得 ' + ME.MINES.normal)
  if (ME.MINES.easy !== 50 || ME.MINES.hard !== 120) fail('难度雷数应为 50/80/120')

  // ① 首点安全：换 20 个种子，第一下都不可能踩雷，而且点中的格一定是空格（周围 8 格都不是雷）
  {
    for (let seed = 0; seed < 20; seed++) {
      let x = seed * 7919 + 13
      const rnd = () => { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648 }
      const e = mkMine({ rnd, now: () => 0 })
      if (!e.tap(0)) fail('首点应能翻开（seed ' + seed + '）')
      const st = e.state()
      if (st.state !== 'playing') fail('首点不该结束这局，实得 ' + st.state + '（seed ' + seed + '）')
      const snap = e.snapshot()
      if (snap.cells[0].mine) fail('首点那格不该是雷（seed ' + seed + '）')
      if (snap.cells[0].n !== 0) fail('首点那格应是空格（布雷时排除了周围 8 格），实得 n=' + snap.cells[0].n)
      for (const j of [1, ME.W, ME.W + 1]) {
        if (!snap.cells[j].open) fail('空格应连锁翻开邻居 ' + j + '（seed ' + seed + '）')
      }
      // 0 号是角落格，只有 3 个邻居 —— 首点至少把这 1+3 格翻开（连锁还会再多）
      if (snap.opened < 4) fail('首点至少应翻开角落格与它的 3 个邻居，实得 ' + snap.opened)
    }
    ok('扫雷引擎：20 个随机种子下首点都不炸、点中的格必为空格、邻居全被连锁翻开')
  }

  // ② 数字正确：400 格全量核对（每个非雷格的数字 = 周围 8 格雷数）
  {
    const e = mkMine({ rnd: () => 0.5, now: () => 0 })
    e.tap(200)
    const snap = e.snapshot()
    for (let i = 0; i < ME.W * ME.H; i++) {
      if (snap.cells[i].mine) continue
      const x = i % ME.W
      const y = (i - x) / ME.W
      let c = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || ny < 0 || nx >= ME.W || ny >= ME.H) continue
          if (snap.cells[ny * ME.W + nx].mine) c++
        }
      }
      if (snap.cells[i].n !== c) fail('第 ' + i + ' 格数字应为 ' + c + '，实得 ' + snap.cells[i].n)
    }
    ok('扫雷引擎：400 格全量核对数字正确（角落/边界也含在内）')
  }

  // ③ 插旗：翻开的不能插旗、插旗的点不开、再点取消
  {
    const e = mkMine({ rnd: () => 0.3, now: () => 0 })
    if (!e.flag(5)) fail('未翻开的格应能插旗')
    if (e.state().flags !== 1) fail('旗数应为 1，实得 ' + e.state().flags)
    if (e.tap(5)) fail('插了旗的格不该被点开')
    if (!e.flag(5)) fail('再点一次应取消插旗')
    if (e.state().flags !== 0) fail('取消后旗数应为 0')
    if (!e.tap(5)) fail('取消插旗后应能点开')
    if (e.flag(5)) fail('已翻开的格不能再插旗')
    ok('扫雷引擎：插旗/取消/互斥都对（翻开的不能插旗、插旗的点不开）')
  }

  // ④ 连开（chord）：旗数够了才连开；插错旗时连开会踩雷
  {
    // 手工造一个"只有 1 颗雷（下标 21）"的局面 —— 用 restore 当摆盘器
    const craft = (over) => {
      const e = mkMine({ now: () => 0 })
      const o = Object.assign({ v: 1, level: 'normal', state: 'playing', placed: true, mines: [21], open: [], flag: [], elapsed: 0, boom: null }, over || {})
      if (!e.restore(o)) fail('手工摆盘失败: ' + JSON.stringify(o))
      return e
    }
    const e1 = craft()
    e1.tap(0)                                   // 0 挨着雷 → n=1，只翻开自己
    if (!e1.snapshot().cells[0].open) fail('0 号格应被翻开')
    if (e1.snapshot().cells[0].n !== 1) fail('0 号格应显示 1')
    if (e1.chord(0)) fail('没插旗时连开应无效（旗数 1 ≠ 0）')
    if (!e1.flag(21)) fail('应能给雷插旗')
    if (!e1.chord(0)) fail('旗数够了应该能连开')
    // 0 号是角落格，邻居只有 1/20/21；21 插了旗 → 连开应翻开 1 和 20
    for (const j of [1, 20]) {
      if (!e1.snapshot().cells[j].open) fail('连开应翻开 ' + j + ' 号格')
    }
    if (e1.snapshot().cells[2].open) fail('2 号不是 0 的邻居，不该被连开')
    if (e1.state().state !== 'playing') fail('这局不该结束（还有 398 格没开）')

    // 插错旗（把非雷格当雷插上）→ 连开会翻到真雷 → 判负
    const e2 = craft()
    e2.tap(0)
    e2.flag(1)                                  // 1 号不是雷，插错
    if (!e2.chord(0)) fail('插错旗时连开也该动手（旗数确实是 1）')
    const st2 = e2.state()
    if (st2.state !== 'lost') fail('连开翻到雷应判负，实得 ' + st2.state)
    if (st2.boom !== 21) fail('应该记录踩到的是 21 号雷，实得 ' + st2.boom)
    ok('扫雷引擎：连开（旗数够了才动手、插错旗会踩雷并记录爆点）')
  }

  // ⑤ 胜负：翻开最后一格获胜（剩余雷自动插旗）；踩雷判负（亮出所有雷）
  {
    const nearly = []
    for (let i = 0; i < ME.W * ME.H; i++) if (i !== 21 && i !== 399) nearly.push(i)
    const e = mkMine({ now: () => 0 })
    if (!e.restore({ v: 1, level: 'normal', state: 'playing', placed: true, mines: [21], open: nearly, flag: [], elapsed: 5, boom: null })) fail('差一格就赢的局面摆盘失败')
    if (e.state().opened !== 398) fail('已翻开数应为 398，实得 ' + e.state().opened)
    e.tap(399)
    const st = e.state()
    if (st.state !== 'won') fail('翻开最后一格应获胜，实得 ' + st.state)
    if (!e.snapshot().cells[21].flag) fail('获胜时剩余的雷应自动插旗')
    if (st.elapsed !== 5) fail('获胜后计时应冻结在 5 秒，实得 ' + st.elapsed)

    const e2 = mkMine({ now: () => 0 })
    if (!e2.restore({ v: 1, level: 'normal', state: 'playing', placed: true, mines: [21, 22], open: [], flag: [], elapsed: 3, boom: null })) fail('踩雷局面摆盘失败')
    e2.tap(21)
    const st2 = e2.state()
    if (st2.state !== 'lost') fail('踩雷应判负，实得 ' + st2.state)
    const snap2 = e2.snapshot()
    if (!snap2.cells[21].open || !snap2.cells[22].open) fail('判负后应亮出所有雷')
    if (!snap2.cells[21].boom) fail('踩到的那格应标记为爆点')
    if (st2.elapsed !== 3) fail('判负后计时应冻结，实得 ' + st2.elapsed)
    if (e2.tap(0)) fail('结束的局不该还能翻格')
    ok('扫雷引擎：翻开最后一格获胜（自动插旗 + 冻结计时）；踩雷判负（亮雷 + 标记爆点 + 终局）')
  }

  // ⑥ 计时：用注入的时钟推进，结束后冻结
  {
    let clock = 1000
    const now = () => clock
    const e = mkMine({ rnd: () => 0.2, now })
    e.tap(0)
    clock += 7000
    if (e.state().elapsed !== 7) fail('7 秒后应显示 7，实得 ' + e.state().elapsed)
    const snap = e.snapshot()
    const mineIdx = snap.cells.find((c) => c.mine).i
    e.tap(mineIdx)
    clock += 5000
    if (e.state().elapsed !== 7) fail('结束后计时不该再走，实得 ' + e.state().elapsed)
    ok('扫雷引擎：计时按真实时间走、结束后冻结在结束那一刻（7s）')
  }

  // ⑦ 存档往返：局面/旗子/难度原样恢复，未结束的局计时接着走
  {
    let clock = 50000
    const e = mkMine({ rnd: () => 0.15, now: () => clock })
    e.tap(37)
    e.flag(0)
    e.flag(399)
    clock += 12000
    const sv = e.serialize()
    const e2 = mkMine({ now: () => clock })
    if (!e2.restore(sv)) fail('自己的存档应该能读回来')
    const a = e.snapshot()
    const b = e2.snapshot()
    if (a.state !== b.state || a.level !== b.level || a.flags !== b.flags || a.opened !== b.opened) {
      fail('存档往返后概要应一致: ' + JSON.stringify([a.state, b.state, a.flags, b.flags, a.opened, b.opened]))
    }
    for (let i = 0; i < ME.W * ME.H; i++) {
      if (a.cells[i].mine !== b.cells[i].mine || a.cells[i].open !== b.cells[i].open || a.cells[i].flag !== b.cells[i].flag || a.cells[i].n !== b.cells[i].n) {
        fail('存档往返后第 ' + i + ' 格不一致')
      }
    }
    if (b.elapsed !== 12) fail('读回后已用时应为 12 秒，实得 ' + b.elapsed)
    clock += 3000
    if (e2.state().elapsed !== 15) fail('未结束的局读回后计时应接着走（15 秒），实得 ' + e2.state().elapsed)
    ok('扫雷引擎：存档往返逐格一致（400 格 + 旗子 + 难度），未结束的局计时接着走')
  }

  // ⑧ 坏存档一律拒绝（每种形态一条断言）
  {
    const base = () => ({ v: 1, level: 'normal', state: 'playing', placed: true, mines: [21], open: [0, 1], flag: [], elapsed: 3, boom: null })
    const bads = [
      ['不是对象', null],
      ['版本号不对', Object.assign(base(), { v: 2 })],
      ['难度非法', Object.assign(base(), { level: 'insane' })],
      ['状态非法', Object.assign(base(), { state: 'paused' })],
      ['雷下标越界', Object.assign(base(), { mines: [9999] })],
      ['雷下标重复', Object.assign(base(), { mines: [21, 21] })],
      ['没有雷', Object.assign(base(), { mines: [] })],
      ['翻开格里有雷但状态不是 lost', Object.assign(base(), { mines: [21], open: [21] })],
      ['用时不合法', Object.assign(base(), { elapsed: -5 })],
      ['翻开数超出格子数', Object.assign(base(), { open: new Array(400).fill(0).map((_, i) => i), mines: [21] })],
      ['mines 不是数组', Object.assign(base(), { mines: '21' })],
    ]
    for (const [name, o] of bads) {
      const e = mkMine({ now: () => 0 })
      if (e.restore(o)) fail('坏存档应被拒绝：' + name)
    }
    ok('扫雷引擎：' + bads.length + ' 种坏存档全部拒绝（版本/难度/状态/越界/重复/矛盾）')
  }

  // ⑨ 难度与重开
  {
    const e = mkMine({ rnd: () => 0.4, now: () => 0 })
    e.reset('hard')
    if (e.state().mines !== 120) fail('困难应是 120 雷，实得 ' + e.state().mines)
    e.tap(10)
    e.flag(11)
    if (e.state().opened === 0) fail('应该翻开过格子')
    e.reset()
    const st = e.state()
    if (st.state !== 'ready' || st.opened !== 0 || st.flags !== 0) fail('重置后应回到未布雷状态：' + JSON.stringify(st))
    if (st.level !== 'hard') fail('重置不带参数时应保持当前难度，实得 ' + st.level)
    if (ME.LEVELS.join(',') !== 'easy,normal,hard') fail('难度档顺序变了')
    ok('扫雷引擎：难度切换（困难 120 雷）与重开（回到未布雷）都对')
  }
}


console.log('\n=== 13. 扫雷浮窗：开窗 / 翻格 / 插旗 / 踩雷 / 续打 / 难度 / 音效 ===')
{
  const toolBtn2 = (label) => walk(instantiate(regs.get('im2005-toolbar').comp), [])
    .find((x) => x.type === 'button' && JSON.stringify(x.children || '').includes(label))
  const mineInj = regs.get('im2005-mine').opts.inject()
  const MV = mineInj.view
  const poolV = regs.get('im2005-pool').opts.inject().view
  const mineWalkErr = []
  // 本节自带遍历器：顶层那个 walk 只收"带 onClick"的节点，找不到容器/标题栏。
  const nodesOf = (n, out, d) => {
    const dd = d || 0
    if (!n || typeof n !== 'object' || dd > 12) return out
    if (typeof n.type === 'function') {
      // ⚠️ 不吞异常：渲染抛错必须变成可见失败，否则"找不到节点"会伪装成断言通过
      try { return nodesOf(instantiate(n.type, n.props), out, dd + 1) } catch (e) { mineWalkErr.push(e.message); return out }
    }
    out.push(n)
    ;(n.children || []).forEach((c) => nodesOf(c, out, dd + 1))
    return out
  }
  const mineInst = () => instantiate(regs.get('im2005-mine').comp, mineInj)
  const mineTree = () => {
    const node = mineInst()
    if (!node) fail('扫雷窗口没渲染出节点')
    return nodesOf(node, [], 0)
  }
  const txt = (n) => {
    if (n === null || n === undefined || n === false) return ''
    if (typeof n === 'string' || typeof n === 'number') return String(n)
    if (Array.isArray(n)) return n.map(txt).join(' ')
    if (typeof n.type === 'function') { try { return txt(instantiate(n.type, n.props)) } catch (e) { return '' } }
    let out = ''
    ;(n.children || []).forEach((c) => { out += ' ' + txt(c) })
    return out
  }
  const textOf2 = () => txt(mineInst())
  const cellsOf = () => mineTree().filter((n) => n.props && n.props.className === 'dsh-skin-im2005-mine-cell')
  const cellOf = (i) => cellsOf().find((n) => n.props['data-i'] === i)

  // 开窗：工具条按钮 → 400 个格子
  toolBtn2('扫雷').props.onClick()
  let list = mineTree()
  if (mineWalkErr.length) fail('扫雷窗口渲染抛错: ' + mineWalkErr[0])
  if (!list.length) fail('点了「扫雷」按钮后应该渲染浮窗')
  const cells = cellsOf()
  if (cells.length !== 400) fail('20×20 应有 400 个格子，实得 ' + cells.length)
  if (list.some((n) => n.props && n.props.className === 'dsh-skin-im2005-mine-cell' && n.props.style.pointerEvents !== 'auto')) {
    fail('格子必须自己打开 pointerEvents:auto（外层容器是 none，且它是继承属性）')
  }
  const mineBox0 = list.find((n) => n.props && n.props.className === 'dsh-skin-im2005-mine')
  if (!mineBox0 || mineBox0.props.style.pointerEvents !== 'none') fail('扫雷容器应 pointerEvents:none（窗外区域让点击穿过）')
  ok('扫雷浮窗：点按钮开窗，渲染 400 个格子（20×20），格子可命中')

  // 层级：和八球同一层，压在 IM 秀之上
  {
    const box = mineTree().find((n) => n.props && n.props.className === 'dsh-skin-im2005-mine')
    if (!box) fail('找不到扫雷窗口容器')
    if (box.props.style.zIndex !== poolV.z) fail('扫雷窗口应与八球同层（' + poolV.z + '），实得 ' + box.props.style.zIndex)
    if (!(poolV.z > poolV.skinZ)) fail('这一层必须在 IM 秀之上')
  }

  // 翻格：点一下 → 该格翻开、写盘、计时开始、出声
  {
    const sfx0 = fake.bursts + fake.tones
    cellOf(0).props.onClick({})            // 首点一定安全（引擎保证）
    let sv = mineInj.save.read()
    if (!sv || !sv.open || !sv.open.length) fail('首点后应该写盘（存档里要有已翻开的格）')
    if (sv.open.indexOf(0) < 0) fail('首点那格应在已翻开列表里')
    // 再点几格 —— 雷位从存档里读，只点确定不是雷的（踩雷会清存档，别赌运气）
    const safe = []
    for (let i = 1; i < 400 && safe.length < 3; i++) {
      if (sv.mines.indexOf(i) < 0 && sv.open.indexOf(i) < 0) safe.push(i)
    }
    for (const i of safe) cellOf(i).props.onClick({})
    sv = mineInj.save.read()
    if (!sv || sv.open.length <= 1) fail('连点几格后已翻开数应增加，实得 ' + (sv && sv.open.length))
    const firstOpen = sv.open[0]
    const oc = cellOf(firstOpen)
    if (!oc) fail('找不到已翻开的格子节点')
    if (oc.props.style.borderTop.indexOf('#808080') < 0) fail('已翻开的格子应换成"凹陷"描边')
    if (fake.bursts + fake.tones <= sfx0) fail('翻格应该有声音')
  }
  ok('扫雷浮窗：左键翻格 → 立刻写盘、格子换凹陷描边、有声音')

  // 插旗：右键插旗（并拦住浏览器菜单）；已翻开的格右键无效
  {
    const sv0 = mineInj.save.read()
    const unopened = []
    for (let i = 0; i < 400; i++) if (sv0.open.indexOf(i) < 0) { unopened.push(i); if (unopened.length >= 2) break }
    let prevented = false
    cellOf(unopened[0]).props.onContextMenu({ preventDefault: () => { prevented = true } })
    if (!prevented) fail('右键必须 preventDefault（否则会弹出浏览器菜单）')
    const sv1 = mineInj.save.read()
    if (!sv1.flag || sv1.flag.indexOf(unopened[0]) < 0) fail('右键应给该格插旗并写盘')
    if (cellOf(unopened[0]).props.children !== '⚑') fail('插旗的格子应显示旗子')
    // 再右键取消
    cellOf(unopened[0]).props.onContextMenu({ preventDefault: () => {} })
    const sv2 = mineInj.save.read()
    if (sv2.flag.indexOf(unopened[0]) >= 0) fail('再右键一次应取消插旗')
    // 已翻开的格右键无效
    const openIdx = mineInj.save.read().open[0]
    const before = mineInj.save.read().flag.length
    cellOf(openIdx).props.onContextMenu({ preventDefault: () => {} })
    if (mineInj.save.read().flag.length !== before) fail('已翻开的格不该能插旗')
  }
  ok('扫雷浮窗：右键插旗/取消（并拦住浏览器菜单）、已翻开的格插不了旗')

  // 连开手感：点一下满足条件的数字就该连开（用户实测"双击要两次"）。
  // ⚠️ 之前只测了引擎的 chord，没测界面手势 —— 所以这个 bug 漏到用户手里了。
  {
    const newBtn3 = () => mineTree().find((n) => n.type === 'button' && String(txt(n)).indexOf('重开') >= 0)
    // 造一个"数字格 + 周围雷都插好旗"的局面；返回目标格与连开前的已翻开数
    const prep = () => {
      newBtn3().props.onClick()
      cellOf(0).props.onClick({})            // 首点安全 → 布雷 + 展开一片
      const sv = mineInj.save.read()
      if (!sv || !sv.mines.length) fail('连开测试前应该有雷（首点后应已布雷）')
      const mineSet = new Set(sv.mines)
      let target = -1
      let nbMines = []
      for (const i of sv.open) {
        const x = i % 20
        const y = (i - x) / 20
        const ms = []
        let safeClosed = 0
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue
            const nx = x + dx
            const ny = y + dy
            if (nx < 0 || ny < 0 || nx >= 20 || ny >= 20) continue
            const j = ny * 20 + nx
            if (mineSet.has(j)) ms.push(j)
            else if (sv.open.indexOf(j) < 0) safeClosed++
          }
        }
        if (ms.length > 0 && safeClosed > 0) { target = i; nbMines = ms; break }
      }
      if (target < 0) fail('找不到可连开的数字格（这局太特殊，换个种子？）')
      for (const m of nbMines) cellOf(m).props.onContextMenu({ preventDefault: () => {} })
      return { target, opened: mineInj.save.read().open.length }
    }
    // ① 单击：满足条件的数字，点一下就开
    const t1 = prep()
    cellOf(t1.target).props.onClick({})
    const o1 = mineInj.save.read()
    if (!o1 || o1.open.length <= t1.opened) fail('单击满足条件的数字应连开，实得 ' + t1.opened + ' -> ' + (o1 && o1.open.length))
    ok('扫雷浮窗：单击满足条件的数字即连开（' + t1.opened + ' → ' + o1.open.length + ' 格）')
    // ② 双击手势（用户报的就是这个）：一次双击必须生效
    const t2 = prep()
    cellOf(t2.target).props.onClick({})
    cellOf(t2.target).props.onClick({})
    cellOf(t2.target).props.onDoubleClick({})
    const o2 = mineInj.save.read()
    if (!o2 || o2.open.length <= t2.opened) fail('一次双击必须能连开，实得 ' + t2.opened + ' -> ' + (o2 && o2.open.length))
    ok('扫雷浮窗：一次双击就生效（' + t2.opened + ' → ' + o2.open.length + ' 格）')
    // ③ 中键（经典连开手势）
    const t3 = prep()
    cellOf(t3.target).props.onAuxClick({ button: 1, preventDefault: () => {} })
    const o3 = mineInj.save.read()
    if (!o3 || o3.open.length <= t3.opened) fail('中键应能连开，实得 ' + t3.opened + ' -> ' + (o3 && o3.open.length))
    ok('扫雷浮窗：中键也能连开（' + t3.opened + ' → ' + o3.open.length + ' 格）')
  }

  // 音效开关与八球共用一份偏好 —— 走用户路径：点音效按钮
  {
    const sfxBtn = () => mineTree().find((n) => n.type === 'button' && String(txt(n)).indexOf('音效') >= 0)
    if (!sfxBtn()) fail('HUD 里应有音效按钮')
    if (!/音效：开/.test(textOf2())) fail('默认应是音效：开')
    sfxBtn().props.onClick()
    if (!/音效：关/.test(textOf2())) fail('点一下应切到音效：关')
    const n0 = fake.bursts + fake.tones
    const sv2 = mineInj.save.read()
    let cand = -1
    for (let i = 0; i < 400; i++) {
      if (sv2.open.indexOf(i) < 0 && sv2.flag.indexOf(i) < 0 && sv2.mines.indexOf(i) < 0) { cand = i; break }
    }
    if (cand < 0) fail('找不到可点的安全格')
    cellOf(cand).props.onClick({})
    if (fake.bursts + fake.tones !== n0) fail('关掉音效后扫雷也不该发声')
    // 再点回来（别把偏好留在关）—— 顺带验证开关是双向的
    sfxBtn().props.onClick()
    if (!/音效：开/.test(textOf2())) fail('再点一下应切回音效：开')
  }
  ok('扫雷浮窗：音效开关与八球共用（关掉后翻格完全静音，再点回来）')

  // 难度：切到困难 → 120 雷 + 落盘 + 重开
  {
    const lvBtn = mineTree().find((n) => n.type === 'button' && String(txt(n)).indexOf('难度') >= 0)
    if (!lvBtn) fail('HUD 里应有难度按钮')
    lvBtn.props.onClick()
    const sv = mineInj.save.read()
    // 注意：重开是"未布雷"状态（雷要等第一次点击才布 —— 首点安全），所以存档里 mines 是空的；
    // 这里验证的是"配置成困难 120 雷"（HUD 读的是配置值）。
    if (!sv || sv.level !== 'hard') fail('切难度应重开一局并切到困难，实得 ' + JSON.stringify(sv && sv.level))
    if (!/雷 120/.test(textOf2())) fail('困难局 HUD 应显示雷 120，实得 ' + JSON.stringify(textOf2().slice(0, 60)))
    if (sv.mines.length !== 0) fail('刚重开的局不该已经布雷（首点安全）')
    if (lsData.get('dsh-skin-im2005.minelv') !== 'hard') fail('难度偏好应落盘')
    if (!/难度：困难/.test(textOf2())) fail('HUD 应显示难度：困难')
  }
  ok('扫雷浮窗：难度切换（困难 = 120 雷）会重开并落盘偏好')

  // 踩雷：从存档里拿到雷的下标 → 点它 → 判负 + 清空存档 + 提示踩雷
  {
    // 切难度后是"未布雷"状态：先点一格让引擎布雷（首点安全），再从存档里挑一颗雷去踩
    cellOf(0).props.onClick({})
    const sv = mineInj.save.read()
    if (!sv || !sv.mines || !sv.mines.length) fail('踩雷前存档里应该有雷位')
    const mineIdx = sv.mines[0]
    cellOf(mineIdx).props.onClick({})
    if (!/踩雷/.test(textOf2())) fail('踩雷后提示应写"踩雷了"')
    if (mineInj.save.read() !== null) fail('判负后应清掉存档（不留一局打不完的）')
    const boomCell = cellOf(mineIdx)
    if (boomCell.props.style.background !== '#ff0000') fail('踩到的那格应标红')
  }
  ok('扫雷浮窗：踩雷 → 标红爆点、提示踩雷、清掉存档')

  // 重开 + 关窗续打
  {
    const newBtn = mineTree().find((n) => n.type === 'button' && String(txt(n)).indexOf('重开') >= 0)
    if (!newBtn) fail('HUD 里应有重开按钮')
    newBtn.props.onClick()
    if (/踩雷/.test(textOf2())) fail('重开后不该还显示踩雷')
    const c = cellOf(150)
    c.props.onClick({})
    const sv = mineInj.save.read()
    if (!sv || sv.open.length === 0) fail('重开后翻格应重新写盘')
    const openedBefore = sv.open.slice()
    // 关窗 → 存档在；再开 → 同一局
    mineTree().find((n) => n.type === 'button' && txt(n).trim() === '✕').props.onClick()
    if (mineTree().length !== 0) fail('关掉后不该渲染任何节点')
    if (!mineInj.save.read()) fail('关掉后存档应还在')
    toolBtn2('扫雷').props.onClick()
    if (cellsOf().length !== 400) fail('再开应重新渲染 400 格')
    const sv2 = mineInj.save.read()
    for (const i of openedBefore) {
      const n2 = cellOf(i)
      if (!n2 || n2.props.style.borderTop.indexOf('#808080') < 0) fail('再开后第 ' + i + ' 格应还是翻开状态')
    }
  }
  ok('扫雷浮窗：重开清桌面；关窗存档在、再开还是同一局（已翻开的格保持翻开）')

  // 拖动标题栏 → 位置落盘；双击回默认
  {
    const title = mineTree().find((n) => n.props && typeof n.props.onPointerDown === 'function' && n.props.onPointerMove)
    const p0 = JSON.parse(lsData.get('dsh-skin-im2005.minepos') || 'null')
    title.props.onPointerDown({ clientX: 100, clientY: 100, pointerId: 1, currentTarget: { setPointerCapture: () => {} } })
    title.props.onPointerMove({ clientX: 400, clientY: 300 })
    title.props.onPointerUp({})
    const p1 = JSON.parse(lsData.get('dsh-skin-im2005.minepos') || 'null')
    if (!p1 || (p0 && p1.x === p0.x && p1.y === p0.y)) fail('拖动标题栏应把位置落盘')
    title.props.onDoubleClick({})
    const p2 = JSON.parse(lsData.get('dsh-skin-im2005.minepos') || 'null')
    if (!p2 || (p2.x === p1.x && p2.y === p1.y)) fail('双击标题栏应回到默认位置')
    // 夹取：往右下拖到天边也不能整窗出视口
    const vw = globalThis.innerWidth || 1200
    const vh = globalThis.innerHeight || 800
    const t2 = mineTree().find((n) => n.props && typeof n.props.onPointerDown === 'function' && n.props.onPointerMove)
    t2.props.onPointerDown({ clientX: 10, clientY: 10, pointerId: 2, currentTarget: { setPointerCapture: () => {} } })
    t2.props.onPointerMove({ clientX: 9999, clientY: 9999 })
    t2.props.onPointerUp({})
    const box = mineTree().find((n) => n.props && n.props.className === 'dsh-skin-im2005-mine')
    if (box.props.style.left + MV.winW > vw + 1 || box.props.style.top + MV.winH > vh + 1) {
      fail('扫雷窗口也必须整窗留在视口内，实得 ' + JSON.stringify({ x: box.props.style.left, y: box.props.style.top }))
    }
  }
  ok('扫雷浮窗：拖动/双击回默认/整窗夹取都对（和八球同一套手感）')

  // 任务完成提示：走真正的观察器路径（和八球那条断言同源）
  {
    fake.running = true
    fake.moCbs.forEach((cb) => cb())
    await new Promise((r) => setTimeout(r, 30))
    fake.running = false
    fake.moCbs.forEach((cb) => cb())
    await new Promise((r) => setTimeout(r, 30))
    if (!/任务完成 · 回来看/.test(textOf2())) fail('AI 回复完成时扫雷标题栏也应闪一行提示')
    const hintNode = mineTree().find((x) => x.props && x.props['data-nodrag'] === '1' && typeof x.props.onClick === 'function')
    if (!hintNode) fail('提示应该可点（点了就消掉）')
    hintNode.props.onClick()
    if (/任务完成 · 回来看/.test(textOf2())) fail('点一下提示应该消失')
  }
  ok('扫雷浮窗：任务完成提示复用同一份 poolHint（不动窗口、点一下消掉）')
}


console.log('\n=== 14. 跨会话备注框：打字 / 跨会话保留 / 关掉再来 ===')
{
  const noteInj = regs.get('im2005-note').opts.inject()
  const NV = noteInj.view
  const toolBtn3 = (label) => walk(instantiate(regs.get('im2005-toolbar').comp), [])
    .find((x) => x.type === 'button' && JSON.stringify(x.children || '').includes(label))
  const nodesOf2 = (n, out, d) => {
    const dd = d || 0
    if (!n || typeof n !== 'object' || dd > 12) return out
    if (typeof n.type === 'function') {
      try { return nodesOf2(instantiate(n.type, n.props), out, dd + 1) } catch (e) { noteWalkErr.push(e.message); return out }
    }
    out.push(n)
    ;(n.children || []).forEach((c) => nodesOf2(c, out, dd + 1))
    return out
  }
  const noteWalkErr = []
  const noteInst = () => instantiate(regs.get('im2005-note').comp, noteInj)
  const noteTree = () => nodesOf2(noteInst(), [], 0)
  const taOf = () => noteTree().find((n) => n.props && n.props.className === 'dsh-skin-im2005-note-text')
  const noteTxt = (n) => {
    if (n === null || n === undefined || n === false) return ''
    if (typeof n === 'string' || typeof n === 'number') return String(n)
    if (Array.isArray(n)) return n.map(noteTxt).join(' ')
    if (typeof n.type === 'function') { try { return noteTxt(instantiate(n.type, n.props)) } catch (e) { return '' } }
    let out = ''
    ;(n.children || []).forEach((c) => { out += ' ' + noteTxt(c) })
    return out
  }

  // 开窗
  toolBtn3('跨会话备注框').props.onClick()
  let tree0 = noteTree()
  if (noteWalkErr.length) fail('备注框渲染抛错: ' + noteWalkErr[0])
  if (!tree0.length) fail('点了「跨会话备注框」按钮后应该出现浮窗')
  const ta = taOf()
  if (!ta) fail('浮窗里应该有可输入的 textarea')
  if (ta.props.style.pointerEvents !== 'auto') fail('textarea 必须自己打开 pointerEvents:auto（容器是 none 且属性会继承）')
  if (!(NV.winW > 200 && NV.winH > 150)) fail('备注框尺寸不合理: ' + JSON.stringify([NV.winW, NV.winH]))
  ok('备注框：点按钮开窗，里面有可输入的 textarea（' + NV.winW + '×' + NV.winH + '）')

  // 打字 → 立刻落盘（草稿纸丢了最难受）
  const BEACON = '切到 B 会话：把复现步骤发给他'
  taOf().props.onChange({ target: { value: BEACON } })
  if (lsData.get('dsh-skin-im2005.note') !== BEACON) {
    fail('输入应当立刻落盘，实得 ' + JSON.stringify(lsData.get('dsh-skin-im2005.note')))
  }
  if (taOf().props.value !== BEACON) fail('受控 textarea 的值应更新')
  if (!new RegExp(BEACON.length + ' 字').test(noteTxt(noteInst()))) fail('底部应显示字数')
  ok('备注框：打字立刻落盘（含字数显示），不靠"关窗口时才存"')

  // 在框里打字不许把按键冒到宿主（否则可能触发 DSH 快捷键）
  {
    let stopped = false
    let nativeStopped = false
    taOf().props.onKeyDown({
      stopPropagation: () => { stopped = true },
      nativeEvent: { stopImmediatePropagation: () => { nativeStopped = true } },
    })
    if (!stopped || !nativeStopped) fail('textarea 的按键必须拦住（合成事件 + 原生都要）')
  }
  ok('备注框：在框里打字会拦住按键冒泡（不会触发 DSH 自己的快捷键）')

  // ★ 核心：切到另一个会话，字还在
  {
    const before = fake.session
    fake.session = 's2'                       // 模拟切到另一个会话
    const tree2 = noteTree()
    const ta2 = tree2.find((n) => n.props && n.props.className === 'dsh-skin-im2005-note-text')
    if (!ta2) fail('切换会话后备注框应该还在（它是全局浮层，不按会话走）')
    if (ta2.props.value !== BEACON) fail('切换会话后内容应该原样保留，实得 ' + JSON.stringify(ta2.props.value))
    fake.session = before
  }
  ok('备注框：切到另一个会话后，框还在、字还在（全局浮层 + 全局存档键）')

  // 关掉 → 内容留着；再点按钮 → 字回来
  {
    const closeBtn = noteTree().find((n) => n.type === 'button' && noteTxt(n).trim() === '✕')
    if (!closeBtn) fail('找不到关闭按钮')
    closeBtn.props.onClick()
    if (noteTree().length !== 0) fail('关掉后不该还渲染')
    if (lsData.get('dsh-skin-im2005.note') !== BEACON) fail('关掉不该清内容')
    if (lsData.get('dsh-skin-im2005.noteopen') !== '0') fail('开关状态应落盘（关）')
    toolBtn3('跨会话备注框').props.onClick()
    const ta3 = taOf()
    if (!ta3) fail('再点按钮应该重新出现')
    if (ta3.props.value !== BEACON) fail('重新打开后内容应还在，实得 ' + JSON.stringify(ta3.props.value))
    if (lsData.get('dsh-skin-im2005.noteopen') !== '1') fail('开关状态应落盘（开）')
  }
  ok('备注框：关掉不清内容、再点按钮字回来（开关本身也落盘，重开 DSH 还是开的）')

  // 拖动 / 夹取 / 双击回默认
  {
    const title = noteTree().find((n) => n.props && typeof n.props.onPointerDown === 'function' && n.props.onPointerMove)
    if (!title) fail('找不到标题栏')
    title.props.onPointerDown({ clientX: 100, clientY: 100, pointerId: 1, currentTarget: { setPointerCapture: () => {} } })
    title.props.onPointerMove({ clientX: 420, clientY: 300 })
    title.props.onPointerUp({})
    const p1 = JSON.parse(lsData.get('dsh-skin-im2005.notepos') || 'null')
    if (!p1) fail('拖动后位置应落盘')
    const t2 = noteTree().find((n) => n.props && typeof n.props.onPointerDown === 'function' && n.props.onPointerMove)
    t2.props.onPointerDown({ clientX: 10, clientY: 10, pointerId: 2, currentTarget: { setPointerCapture: () => {} } })
    t2.props.onPointerMove({ clientX: 9999, clientY: 9999 })
    t2.props.onPointerUp({})
    const box = noteTree().find((n) => n.props && n.props.className === 'dsh-skin-im2005-note')
    const vw = globalThis.innerWidth || 1200
    const vh = globalThis.innerHeight || 800
    if (box.props.style.left + NV.winW > vw + 1 || box.props.style.top + NV.winH > vh + 1) {
      fail('备注框也要整窗夹在视口内，实得 ' + JSON.stringify({ x: box.props.style.left, y: box.props.style.top }))
    }
    const t3 = noteTree().find((n) => n.props && typeof n.props.onPointerDown === 'function' && n.props.onPointerMove)
    t3.props.onDoubleClick({})
    const p2 = JSON.parse(lsData.get('dsh-skin-im2005.notepos') || 'null')
    if (!p2 || (p2.x === box.props.style.left && p2.y === box.props.style.top)) fail('双击标题栏应回默认位置')
  }
  ok('备注框：拖动/夹取/双击回默认（和游戏窗口同一套手感）')

  // 清空
  {
    const clr = noteTree().find((n) => n.type === 'button' && noteTxt(n).trim() === '清空')
    if (!clr) fail('应有清空按钮')
    clr.props.onClick()
    if (taOf().props.value !== '') fail('清空后 textarea 应为空')
    if (lsData.get('dsh-skin-im2005.note') !== '') fail('清空要落盘（否则重开又冒出来）')
  }
  ok('备注框：清空生效并落盘')
}


console.log('\n=== 15. Token农场：生长 / 浇水 / 收获 / 升级 / 余额与轮次驱动 / 存档 ===')
{
  const farmInj = regs.get('im2005-farm').opts.inject()
  const FE = farmInj.engine.FARM
  const mf = (now) => farmInj.engine.create({ now: now || 1000 })

  if (FE.COLS * FE.ROWS !== 12) fail('农场网格应是 4×3=12 块')
  if (FE.START_PLOTS !== 6) fail('起始应是 6 块地')

  // ① 初始状态与"种"
  {
    const e = mf()
    const st = e.state()
    if (st.unlocked !== 6 || st.level !== 1 || st.water !== 3 || st.coins !== 20) {
      fail('初始状态不对: ' + JSON.stringify({ u: st.unlocked, lv: st.level, w: st.water, c: st.coins }))
    }
    const T0 = 1000000
    if (!e.plant(0, 'tomato', T0)) fail('空地 + 有钱 + 等级够，应该能种')
    const st2 = e.state()
    if (st2.coins !== 15) fail('种番茄应扣 5 金币，实得 ' + st2.coins)
    if (st2.plots[0].crop !== 'tomato') fail('地块 0 应有作物')
    if (e.plant(0, 'tomato', T0)) fail('同一块地不该重复种')
    if (e.plant(1, 'corn', T0)) fail('玉米要 3 级，1 级不该能种')
    if (e.plant(1, 'melon', T0)) fail('西瓜要 6 级，1 级不该能种')
    e.plant(1, 'tomato', T0)
    e.plant(2, 'tomato', T0)
    if (!e.plant(3, 'tomato', T0)) fail('剩 5 金币刚好还够种一颗')
    if (e.plant(4, 'tomato', T0)) fail('金币归零后不该再种得起')
    if (e.plant(6, 'tomato', T0)) fail('未解锁的地块不该能种')
    ok('农场：初始 6 块地/20 金币/3 滴水；种地扣钱、重复与等级/金币不足都被拒')
  }

  // ② 时间生长：按时间推进分阶段，到点成熟
  {
    const e = mf()
    const T0 = 2000000
    e.plant(0, 'tomato', T0)
    const total = FE.CROPS.tomato.minutes * 60000
    const at = (dt) => e.snapshot(T0 + dt).plots[0]
    if (at(1).stage !== 1) fail('刚下种应是阶段 1（种），实得 ' + at(1).stage)
    if (at(total * 0.3).stage !== 2) fail('30% 应是阶段 2（发芽），实得 ' + at(total * 0.3).stage)
    if (at(total * 0.7).stage !== 3) fail('70% 应是阶段 3（长高），实得 ' + at(total * 0.7).stage)
    if (at(total + 1).stage !== 4) fail('到点应成熟，实得 ' + at(total + 1).stage)
    if (e.snapshot(T0 + 1).ready !== 0 || e.snapshot(T0 + total + 1).ready !== 1) fail('ready 计数不对')
    if (e.harvest(0, T0 + 1)) fail('没熟的不能收')
    ok('农场：时间驱动 —— 种→发芽→长高→成熟，未熟不能收（ready 计数同步）')
  }

  // ③ 浇水：花 1 滴水、缩短时间、收益递减、最多缩到 20%
  {
    const e = mf()
    const T0 = 3000000
    const total = FE.CROPS.tomato.minutes * 60000
    e.plant(0, 'tomato', T0)
    const ripe0 = e.snapshot(T0).plots[0].ripeAt
    if (!e.water(0)) fail('有水时应能浇水')
    const ripe1 = e.snapshot(T0).plots[0].ripeAt
    const gain1 = ripe0 - ripe1
    if (gain1 !== FE.WATER_MIN * 60000) fail('第一滴水应缩短 ' + FE.WATER_MIN + ' 分钟，实得 ' + (gain1 / 60000))
    if (e.state().water !== 2) fail('浇水应扣 1 滴水')
    if (!e.water(0)) fail('第二次也应能浇')
    const gain2 = ripe1 - e.snapshot(T0).plots[0].ripeAt
    if (!(gain2 < gain1)) fail('第二滴水的收益应更小（收益递减），实得 ' + gain2 + ' vs ' + gain1)
    // 浇到爆：不能突破"最长压缩到 20%"
    for (let i = 0; i < 200; i++) e.water(0)
    const plot = e.snapshot(T0).plots[0]
    const floorAt = T0 + total * FE.WATER_FLOOR
    if (Math.abs(plot.ripeAt - floorAt) > 1) fail('浇水最多把时长压到 ' + (FE.WATER_FLOOR * 100) + '%，实得 ' + ((plot.ripeAt - T0) / total))
    const w0 = e.state().water
    if (e.water(0)) fail('已经压到底就不该再花水')
    if (e.state().water !== w0) fail('压到底后浇水不该扣水')
    ok('农场：浇水缩短生长（首滴 ' + FE.WATER_MIN + ' 分钟）、收益递减、最多压到 20%、到底不再花水')
  }

  // ④ 收获与升级：给金币经验、开新地
  {
    const e = mf()
    const T0 = 4000000
    const total = FE.CROPS.tomato.minutes * 60000
    e.plant(0, 'tomato', T0)
    const c0 = e.state().coins
    if (!e.harvest(0, T0 + total + 1)) fail('熟了应能收')
    const st = e.state()
    if (st.coins !== c0 + FE.CROPS.tomato.gold) fail('收获应加金币')
    if (st.plots[0].crop !== null) fail('收获后地块应清空')
    if (st.stat.harvested !== 1) fail('收获计数不对')
    // 攒够 100 经验 → 2 级 → 7 块地
    for (let k = 0; k < 10; k++) { e.plant(0, 'tomato', T0); e.harvest(0, T0 + total + 1) }
    const st2 = e.state()
    if (st2.xp < FE.LEVEL_XP) fail('收 10 茬应攒够 100 经验，实得 ' + st2.xp)
    if (st2.level !== 2) fail('100 经验应到 2 级，实得 ' + st2.level)
    if (st2.unlocked !== 7) fail('2 级应开 7 块地，实得 ' + st2.unlocked)
    if (!e.plant(6, 'tomato', T0)) fail('新开的地应能种')
    ok('农场：收获给金币经验、100 经验升 2 级并新开一块地（Lv2 → 7 块）')
  }

  // ⑤ 余额消耗 → 水滴（零头累积，充值不加速）
  {
    const e = mf()
    const r0 = e.creditBalance(12.00)
    if (!r0.ok || !r0.first || r0.drops !== 0) fail('第一次读数应只记起点')
    const w0 = e.state().water
    const r1 = e.creditBalance(11.75)
    if (!r1.ok || r1.drops !== 2) fail('降 ¥0.25 应给 2 滴（步长 ¥0.10），实得 ' + JSON.stringify(r1))
    if (e.state().water !== w0 + 2) fail('水应 +2')
    const r2 = e.creditBalance(11.70)
    if (r2.drops !== 1) fail('零头累积到位就该给水：0.05+0.05 = 0.10 = 1 滴，实得 ' + JSON.stringify(r2))
    const r3 = e.creditBalance(11.60)
    if (r3.drops !== 1) fail('再降 ¥0.10 应再给 1 滴，实得 ' + JSON.stringify(r3))
    const r3b = e.creditBalance(11.55)
    if (r3b.drops !== 0) fail('降 ¥0.05 不足 1 滴，不该给水（零头留着）')
    const r4 = e.creditBalance(20.00)
    if (!r4.ok || r4.drops !== 0 || !r4.toppedUp) fail('余额上升（充值）不该换算成水，只更新游标')
    if (e.creditBalance('abc').ok) fail('非法读数应被拒')
    if (e.creditBalance(-1).ok) fail('负数余额应被拒')
    ok('农场：余额消耗驱动（¥0.25→2 滴、零头累积不丢、充值只更新游标不加速）')
  }

  // ⑥ 轮次驱动 + 水袋上限
  {
    const e = mf()
    const w0 = e.state().water
    e.onTurn()
    if (e.state().water !== w0 + FE.TURN_WATER) fail('每轮应 +1 滴')
    for (let i = 0; i < 1000; i++) e.onTurn()
    if (e.state().water !== FE.WATER_CAP) fail('水袋应有上限 ' + FE.WATER_CAP + '，实得 ' + e.state().water)
    ok('农场：轮次驱动每轮 +1 滴，水袋封顶 ' + FE.WATER_CAP + ' 滴')
  }

  // ⑥b 生长是**无限**的（用户要求：太快到顶很无聊）
  {
    const STEP = FE.TIER_STEP
    const e = mf()
    const T0 = 6000000
    e.setPlant('tomato', T0)
    // 一直浇：档位名字必须一直在变，永远不到"最茂盛"的死路
    for (let i = 0; i < 6; i++) e.addGrowth(0, STEP)
    const names = []
    for (let i = 0; i < 8; i++) {
      e.addGrowth(0, STEP * 7)
      names.push(e.snapshot(T0).plots[0].tierName)
    }
    const uniq = new Set(names)
    if (uniq.size < 6) fail('生长档位名应持续推进，实得 ' + JSON.stringify(names))
    const last = e.snapshot(T0).plots[0]
    if (!/×/.test(last.tierName)) fail('超过视觉上限后档位名应带 ×N，实得 ' + last.tierName)
    if (last.tier > FE.MAX_GROWTH) fail('视觉档应封顶在 ' + FE.MAX_GROWTH + '（形状不糊），实得 ' + last.tier)
    if (!(last.growth > 100)) fail('生长值应无上限地累积，实得 ' + last.growth)
    // 时间也会一直长（不封顶），所以"什么都不做"也不卡住
    const e2 = mf()
    const T1 = 9000000
    e2.setPlant('tomato', T1)
    e2.tickGrowth(0, T1 + 10 * 60000)     // 时间生长由 tickGrowth 推进（界面每次渲染都会调它）
    const g1 = e2.snapshot(T1 + 10 * 60000).plots[0].growth
    e2.tickGrowth(0, T1 + 400 * 60000)
    const g2 = e2.snapshot(T1 + 400 * 60000).plots[0].growth
    if (!(g2 > g1)) fail('纯时间也应持续生长（只增不减），实得 ' + g1 + ' → ' + g2)
  }
  ok('农场引擎：生长无限（档位名持续推进到 ×N、视觉封顶不糊、时间也会一直长）')

  // ⑦ 存档往返 + 坏存档拒绝
  {
    const e = mf()
    const T0 = 5000000
    e.plant(0, 'tomato', T0)
    e.plant(1, 'tomato', T0)
    e.water(0)
    e.creditBalance(9.00)
    e.setSeed('corn')
    const sv = e.serialize()
    const e2 = mf()
    if (!e2.restore(sv)) fail('自己的存档应能读回')
    const a = JSON.stringify(e.snapshot(T0 + 1000))
    const b = JSON.stringify(e2.snapshot(T0 + 1000))
    if (a !== b) fail('存档往返后局面应逐字段一致')
    const bads = [
      ['不是对象', null],
      ['版本号不对', Object.assign(JSON.parse(JSON.stringify(sv)), { v: 2 })],
      ['地块数不对', Object.assign(JSON.parse(JSON.stringify(sv)), { plots: [{}] })],
      ['作物名非法', (() => { const o = JSON.parse(JSON.stringify(sv)); o.plots[0].crop = 'weed'; return o })()],
      ['空地却带生长数据', (() => { const o = JSON.parse(JSON.stringify(sv)); o.plots[2] = { crop: null, plantedAt: 5, water: 0 }; return o })()],
      ['有作物却没有下种时间', (() => { const o = JSON.parse(JSON.stringify(sv)); o.plots[0].plantedAt = 0; return o })()],
      ['金币为负', (() => { const o = JSON.parse(JSON.stringify(sv)); o.coins = -5; return o })()],
      ['种子非法', (() => { const o = JSON.parse(JSON.stringify(sv)); o.seed = 'rock'; return o })()],
      ['水量超范围', (() => { const o = JSON.parse(JSON.stringify(sv)); o.water = 1e12; return o })()],
    ]
    for (const [name, o] of bads) {
      const e3 = mf()
      if (e3.restore(o)) fail('坏存档应被拒绝：' + name)
    }
    ok('农场：存档往返逐字段一致；' + bads.length + ' 种坏存档全部拒绝')
  }
}


console.log('\n=== 16. Token农场浮窗：一株植物 / 种·浇·收 / 余额与轮次驱动 / 续种 ===')
{
  const farmInj = regs.get('im2005-farm').opts.inject()
  const FV = farmInj.view
  const FARM2 = farmInj.engine.FARM
  const toolBtn4 = (label) => walk(instantiate(regs.get('im2005-toolbar').comp), [])
    .find((x) => x.type === 'button' && JSON.stringify(x.children || '').includes(label))
  const farmWalkErr = []
  const nodesOf3 = (n, out, d) => {
    const dd = d || 0
    if (!n || typeof n !== 'object' || dd > 12) return out
    if (typeof n.type === 'function') {
      try { return nodesOf3(instantiate(n.type, n.props), out, dd + 1) } catch (e) { farmWalkErr.push(e.message); return out }
    }
    out.push(n)
    ;(n.children || []).forEach((c) => nodesOf3(c, out, dd + 1))
    return out
  }
  const farmInst = () => instantiate(regs.get('im2005-farm').comp, farmInj)
  const farmTree = () => {
    const node = farmInst()
    if (!node) fail('农场窗口没渲染出节点')
    return nodesOf3(node, [], 0)
  }
  const ftxt = (n) => {
    if (n === null || n === undefined || n === false) return ''
    if (typeof n === 'string' || typeof n === 'number') return String(n)
    if (Array.isArray(n)) return n.map(ftxt).join(' ')
    if (typeof n.type === 'function') { try { return ftxt(instantiate(n.type, n.props)) } catch (e) { return '' } }
    let out = ''
    ;(n.children || []).forEach((c) => { out += ' ' + ftxt(c) })
    return out
  }
  const farmTxt = () => ftxt(farmInst())
  const canvasOf = () => farmTree().find((n) => n.props && n.props.className === 'dsh-skin-im2005-farm-canvas')
  const readSave = () => farmInj.save.read()
  const recorder = () => {
    const calls = { n: 0 }
    const colors = []
    let cur = ''
    const g = new Proxy({}, {
      get: (t2, k) => {
        if (k === 'fillStyle' || k === 'strokeStyle') return cur
        return () => { calls.n++ }
      },
      set: (t2, k, v) => { if (k === 'fillStyle') { cur = v; colors.push(v) } return true },
    })
    return { calls, colors, cv: { width: 0, height: 0, style: {}, getContext: () => g, getBoundingClientRect: () => ({ left: 0, top: 0 }) } }
  }

  // 摆一份存档：那一株已经熟了（30 分钟前种的番茄）
  {
    const plots = []
    for (let i = 0; i < FARM2.COLS * FARM2.ROWS; i++) plots.push({ crop: null, plantedAt: 0, water: 0 })
    plots[0] = { crop: 'tomato', plantedAt: Date.now() - 30 * 60000, water: 1, growth: 2 }
    lsData.set('dsh-skin-im2005.farm', JSON.stringify({
      v: 1, plots, unlocked: 6, coins: 40, xp: 30, water: 5,
      cursor: { balanceCents: null, fracCents: 0 }, seed: 'tomato',
      stat: { turns: 0, harvested: 0, watered: 0, spentYuan: 0 },
    }))
  }

  toolBtn4('Token农场').props.onClick()
  if (farmWalkErr.length) fail('农场窗口渲染抛错: ' + farmWalkErr[0])
  if (!farmTree().length) fail('点了「Token农场」按钮后应该出现浮窗')
  const cv = canvasOf()
  if (!cv) fail('农场里应该有一块 canvas')
  if (cv.props.style.pointerEvents !== 'auto') fail('canvas 必须自己打开 pointerEvents:auto')
  if (!/水 5/.test(farmTxt())) fail('HUD 应显示水 5')
  // 宽度预算：HUD 里所有文字按"每字 11px + 内边距"估一遍，必须装得下窗口 ——
  // 夹具没有真实排版，只能这样防"水 N 被裁"（用户实测过两次）
  {
    const row = farmTree().find((n) => n.props && n.props.className === 'dsh-skin-im2005-farm-hud')
    if (!row) fail('找不到 HUD 行')
    const estimate = (n) => {
      if (n === null || n === undefined || n === false) return 0
      if (typeof n === 'string') return String(n).replace(/[\u4e00-\u9fa5]/g, 'xx').length * 5.6
      if (typeof n === 'number') return String(n).length * 5.6
      if (Array.isArray(n)) return n.reduce((a, c) => a + estimate(c), 0)
      let w = 18
      if (n.type === 'button') w += 16
      w += estimate(n.children)
      return w
    }
    const need = estimate(row.children)
    if (need > FV.winW - 10) {
      fail('HUD 内容估算宽度 ' + need.toFixed(0) + 'px 超过窗口 ' + (FV.winW - 10) + 'px，文字会被裁 —— 该精简或加宽')
    }
  }
  if (!/植物：番茄/.test(farmTxt())) fail('HUD 按钮应写植物：番茄（不是种子）')
  if (/金币|Lv /.test(farmTxt())) fail('不该再有金币/等级（取消了收菜经济）')
  if (!/番茄 · /.test(farmTxt())) fail('提示行应显示 品种 · 生长阶段，实得 ' + JSON.stringify(farmTxt().slice(0, 110)))
  if (/（.*）/.test(farmTxt())) fail('提示里不该带括号解释，实得 ' + JSON.stringify(farmTxt().slice(0, 120)))
  ok('农场浮窗：开窗即渲染，HUD（生长阶段/水）装得下、按钮是「植物：X」、文案无括号解释')

  // ★ 打开就该有画面（用户实测"没有图像"）+ 农场音效默认关
  {
    const rec = recorder()
    cv.props.ref.current = rec.cv
    fake.runEffects = true
    farmTxt()                                  // 只渲染，不点击
    fake.runEffects = false
    if (rec.calls.n < 30) fail('只渲染一次就该把这一株画出来，实得 ' + rec.calls.n + ' 笔')
    if (!rec.colors.includes('#bfe3f5')) fail('应该画过天空底色 #bfe3f5')
    if (!rec.colors.includes('#6b4a2f')) fail('应该画过土的底色 #6b4a2f')
    if ((rec.cv.width <= 0) || (rec.cv.height <= 0)) fail('画布位图尺寸不该是 0')
  }
  if (!/音效：关/.test(farmTxt())) fail('农场音效应默认关闭，实得 ' + JSON.stringify(farmTxt().slice(0, 100)))
  ok('农场浮窗：打开即有画面（仅渲染就画出天空/土），音效默认关闭')

  // 先把音效打开（默认关已在上一条断言），动作块里顺带验"真的出声"
  {
    const sfxBtn0 = farmTree().find((n) => n.type === 'button' && ftxt(n).indexOf('音效') >= 0)
    if (!sfxBtn0) fail('HUD 里应有音效按钮')
    sfxBtn0.props.onClick()
    if (!/音效：开/.test(farmTxt())) fail('点一下应切到音效：开')
    if (lsData.get('dsh-skin-im2005.farmsfx') !== '1') fail('农场音效偏好应独立落盘')
  }

  // 浇水（只加生长，不收菜）→ 换植物（生长保留）→ 生长只增不减
  {
    const nBefore = fake.bursts + fake.tones
    const g0 = Number(readSave().plots[0].growth) || 0
    const w0 = readSave().water
    canvasOf().props.onClick({})
    let sv = readSave()
    if (sv.water !== w0 - 1) fail('点一下该浇 1 滴水，实得 ' + sv.water + '（原 ' + w0 + '）')
    if (!(sv.plots[0].growth > g0)) fail('浇水应让生长值变大（只增不减）')
    if (sv.plots[0].crop !== 'tomato') fail('浇水不该把植物清掉（没有收菜这回事）')
    if (fake.bursts + fake.tones === nBefore) fail('音效开着时浇水应该出声')
    // 换植物：品种变了，长出来的部分必须原样保留
    const g1 = Number(sv.plots[0].growth) || 0
    farmTree().find((n) => n.type === 'button' && ftxt(n).indexOf('植物') >= 0).props.onClick()
    sv = readSave()
    if (sv.plots[0].crop === 'tomato') fail('换植物应换掉品种')
    if (sv.plots[0].growth !== g1) fail('换植物不该重置生长（养成游戏不能倒退），实得 ' + sv.plots[0].growth + ' vs ' + g1)
  }
  ok('农场浮窗：浇水只加生长、换植物保留已长成的部分（生长只增不减）')

  // 余额驱动（读一次余额记起点；下降 → 换水）
  {
    fake.runEffects = true
    farmTxt()
    await new Promise((r) => setTimeout(r, 0))
    fake.runEffects = false
    if (!/已记为起点/.test(farmTxt())) fail('开窗应读一次余额记为起点，实得 ' + JSON.stringify(farmTxt().slice(0, 130)))
    const w0 = readSave().water
    const oldBal = ctx.remote.account.getBalance
    // 桩初始 12.3456 → 给 12.0956 正好降 ¥0.25 = 2 滴
    ctx.remote.account.getBalance = () => ({ ok: true, value: { status: 'ready', value: [{ currency: 'CNY', balance: '12.0956' }], bonusWallets: [] } })
    const balBtn = farmTree().find((n) => n.type === 'button' && ftxt(n).indexOf('余额') >= 0)
    balBtn.props.onClick()
    await new Promise((r) => setTimeout(r, 0))
    const sv = readSave()
    if (sv.water !== w0 + 2) fail('余额降 ¥0.25 应换 2 滴水（原 ' + w0 + ' → ' + sv.water + '）')
    if (!/消耗 .*\+2 滴水/.test(farmTxt())) fail('提示应写明消耗与换到的水滴')
    ctx.remote.account.getBalance = oldBal
  }
  ok('农场浮窗：余额下降 → 水滴（¥0.25 → 2 滴，并在提示里写明）')

  // 轮次驱动（走真正的任务完成观察器）
  {
    const w0 = readSave().water
    fake.running = true
    fake.moCbs.forEach((cb) => cb())
    await new Promise((r) => setTimeout(r, 30))
    fake.running = false
    fake.moCbs.forEach((cb) => cb())
    await new Promise((r) => setTimeout(r, 30))
    if (readSave().water !== w0 + 1) fail('完成一轮应 +1 滴水，实得 ' + w0 + ' → ' + readSave().water)
  }
  ok('农场浮窗：完成一轮 AI 回复 → +1 滴水（走真正的任务完成观察器）')

  // 关窗再开 + 拖动/夹取/双击回默认
  {
    const sv0 = readSave()
    farmTree().find((n) => n.type === 'button' && ftxt(n).trim() === '✕').props.onClick()
    if (farmTree().length !== 0) fail('关掉后不该还渲染')
    toolBtn4('Token农场').props.onClick()
    const sv1 = readSave()
    if (sv1.plots[0].crop !== sv0.plots[0].crop) fail('再开后那一株应该还在')
    if (sv1.plots[0].water !== sv0.plots[0].water) fail('再开后浇水次数应该还在')
    const title = farmTree().find((n) => n.props && typeof n.props.onPointerDown === 'function' && n.props.onPointerMove)
    title.props.onPointerDown({ clientX: 100, clientY: 100, pointerId: 1, currentTarget: { setPointerCapture: () => {} } })
    title.props.onPointerMove({ clientX: 9999, clientY: 9999 })
    title.props.onPointerUp({})
    const box = farmTree().find((n) => n.props && n.props.className === 'dsh-skin-im2005-farm')
    const vw = globalThis.innerWidth || 1200
    const vh = globalThis.innerHeight || 800
    if (box.props.style.left + FV.winW > vw + 1 || box.props.style.top + FV.winH > vh + 1) {
      fail('农场窗口要整窗夹取，实得 ' + JSON.stringify({ x: box.props.style.left, y: box.props.style.top }))
    }
    const t2 = farmTree().find((n) => n.props && typeof n.props.onPointerDown === 'function' && n.props.onPointerMove)
    t2.props.onDoubleClick({})
    const box2 = farmTree().find((n) => n.props && n.props.className === 'dsh-skin-im2005-farm')
    if (box2.props.style.left === box.props.style.left && box2.props.style.top === box.props.style.top) fail('双击标题栏应回默认位置')
  }
  ok('农场浮窗：关窗存档、再开续种；拖动/夹取/双击回默认都对')

  // 音效开关回位（默认关是产品行为，别把测试环境留成开）
  {
    const sfxBtn2 = farmTree().find((n) => n.type === 'button' && ftxt(n).indexOf('音效') >= 0)
    sfxBtn2.props.onClick()
    if (!/音效：关/.test(farmTxt())) fail('再点一下应切回音效：关')
  }
  // ★ 不许串味：农场开关只能写自己的键，绝不能碰提醒 / 游戏音效的任何状态
  {
    const before = JSON.stringify([lsData.get('dsh-skin-im2005.notify'), lsData.get('dsh-skin-im2005.sfx')])
    farmTree().find((n) => n.type === 'button' && ftxt(n).indexOf('音效') >= 0).props.onClick()
    const after = JSON.stringify([lsData.get('dsh-skin-im2005.notify'), lsData.get('dsh-skin-im2005.sfx')])
    if (before !== after) fail('农场音效开关不该改动提醒/游戏音效的任何状态')
    if (lsData.get('dsh-skin-im2005.farmsfx') === undefined) fail('农场音效应写自己的键')
  }
  ok('农场浮窗：音效默认关闭、只写自己的键（不牵连提醒与游戏音效）')
}


console.log('\n=== 17. 静态审计：功能之间不许互相改共享状态 ===')
{
  const src = fs.readFileSync('dsh-skin-im2005/client.js', 'utf8')
  const region = (name) => {
    const a = src.indexOf('/* ' + name + ':BEGIN */')
    const b = src.indexOf('/* ' + name + ':END */')
    if (a < 0 || b < 0) fail('找不到标记区 ' + name)
    return src.slice(a, b)
  }
  // ① 农场自己的音效开关，绝不能去写全局音效位（用户实测：关了农场声音，别处也哑了）
  {
    const r = region('FARM-VIEW')
    if (/poolSfx\s*\.\s*on\s*=/.test(r)) fail('FARM-VIEW 里不该给 poolSfx.on 赋值（会改掉全局音效开关）')
    if (/writeNotifyFlag|NOTIFY_KEY/.test(r)) fail('FARM-VIEW 里不该碰提醒功能的开关/键')
    if (!/farmSfx/.test(r)) fail('FARM-VIEW 应该读自己的 farmSfx')
  }
  // ② 给 poolSfx.on 赋值的写法只允许一种：**从共享 store 同步**（s.poolSfx）。
  //    农场当初写的是 poolSfx.on = s.farmSfx === true —— 用自己的开关去改全局开关，
  //    于是"关掉农场声音"把别处的音效一起关了（用户实测）。规则收紧到这一步才拦得住。
  {
    const bad = []
    src.split('\n').forEach((L, i) => {
      const m2 = /poolSfx\s*\.\s*on\s*=\s*(.+)$/.exec(L)
      if (!m2) return
      const rhs = m2[1].trim()
      // 允许的两种：① 从共享 store 同步（s.poolSfx）；② 注入给外部/测试的显式 setter（!!on）
      const okForm = /s\.poolSfx/.test(rhs) || /sfx:\s*\{\s*set:/.test(L)
      if (!okForm) bad.push('L' + (i + 1) + ': ' + L.trim())
    })
    if (bad.length) fail('poolSfx.on 只能从共享 store 同步（s.poolSfx），实得: ' + JSON.stringify(bad))
  }
  // ③ 每个功能只写自己的 localStorage 键（跨功能写键 = 隐形耦合）
  {
    const bad = []
    let cur = ''
    src.split('\n').forEach((L, i) => {
      const open = L.match(/\/\* ([A-Z-]+):BEGIN \*\//)
      if (open) cur = open[1]
      const close = L.match(/\/\* ([A-Z-]+):END \*\//)
      if (close) cur = ''
      const m = /localStorage\.setItem\(\s*'([a-z0-9-]+)\.([a-z]+)'/.exec(L)
      if (m && cur) {
        const feature = m[2]
        const owner = { farm: 'FARM', note: 'NOTE', mine: 'MINE', pool: 'POOL', notepos: 'NOTE', farmpos: 'FARM', minepos: 'MINE', poolpos: 'POOL' }[feature]
        if (owner && cur.indexOf(owner) < 0) bad.push(cur + ' 写了 ' + feature + ' 的键@L' + (i + 1))
      }
    })
    if (bad.length) fail('跨功能写存储键: ' + JSON.stringify(bad))
  }
  ok('静态审计：农场不碰全局音效/提醒状态；poolSfx.on 只在音效区写；各功能只写自己的存储键')
}

console.log('\nALL CHECKS PASSED ✓')
