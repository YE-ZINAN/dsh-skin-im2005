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
globalThis.window = {
  __ModuleLoader__: { load: (m) => { captured = m } },
  open: (url) => { openedUrls.push(String(url)); return null },
  localStorage: {
    getItem: (k) => (lsData.has(k) ? lsData.get(k) : null),
    setItem: (k, v) => lsData.set(k, String(v)),
    removeItem: (k) => lsData.delete(k),
  },
}
await import(file)

const fail = (m) => { console.error('FAIL: ' + m); process.exit(1) }
const ok = (m) => console.log('  ✓ ' + m)
if (!captured) fail('client.js did not call __ModuleLoader__.load')
if (captured.id !== 'dsh-skin-im2005') fail('module id = ' + captured.id)

// ---------------- fake React: per-component hook state, like the real thing ----
let currentComp = null
let hookIdx = 0
const stateMap = new WeakMap()

const React = {
  // Real React also exposes children as props.children — components that read
  // `props.children` (like our QqSection wrapper) depend on it.
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
  useEffect: () => {},
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
// 账户名必须以 CSS 变量注入（content 不能直接读 JS 数据）——
// 名字是异步取到的，所以这条断言放在「取到账户信息」之后（见 6d）。
ok('消息抬头: 名字(账户名/AI) + 时间 常显，时间转灰（IM 聊天记录风）')
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

console.log('\n=== 5. 工具条 = 两个真按钮（余额 / 形象秀固定）===')
const toolBtns = walk(render(regs.get('im2005-toolbar').comp), [])
if (toolBtns.length !== 2) fail('工具条应恰好 2 个按钮，实际 ' + toolBtns.length)
const labels = toolBtns.map((b) => (b.children || []).map((c) => (c && c.children) || c).join(''))
if (!labels.some((l) => String(l).includes('余额'))) fail('缺少余额按钮，实得 ' + JSON.stringify(labels))
if (!labels.some((l) => String(l).includes('形象秀'))) fail('缺少 形象秀固定按钮，实得 ' + JSON.stringify(labels))
ok('2 个按钮: ' + JSON.stringify(labels))

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

// 账户名已注入为 CSS 变量（供消息抬头 ::before 的 content: var(...) 使用）。
// 异步 —— 必须放在取到账户信息之后再断言。
const ctlStyle2 = findStyles(render(regs.get('im2005-skin-control').comp), []).join('')
if (!ctlStyle2.includes(':root{--dsh-im-username:"测试用户"}')) {
  fail('未把账户名注入 --dsh-im-username，实得 style: ' + JSON.stringify(ctlStyle2.slice(-160)))
}
ok('账户名已注入 CSS 变量 → 消息抬头显示真实用户名')
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

console.log('\nALL CHECKS PASSED ✓')
