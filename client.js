/**
 * dsh-skin-im2005 — Client half.
 *
 * Route A (theme layer): ONE override layer stacked on the active theme via
 *   `ctx.theme.overrideTokens(source, tokens)`.
 *   CONTRACT: every value is a `{ light, dark }` pair of strings — a bare string
 *   makes `validateOverrides` reject the WHOLE layer (silently, unless surfaced).
 *   Surfaces stay WHITE; the era comes from square corners, hard 1px/2px rules,
 *   SimSun, the IM blue accent and grey scrollbars.
 *
 * Route B (decorations): strips in REAL host slots, recovered by static analysis
 *   of the client bundles (69 slots total):
 *     conversation.session.header  IM blue gradient title bar + live clock
 *     conversation.composer.bar    ASCII emoticon row — click copies to clipboard
 *     conversation.composer.dock   skin intensity cycler + diagnostic
 *     sidebar.brand.mark           pixel penguin badge
 *     sidebar.footer.action        online status + live clock
 *     shell.overlay                collapsible "形象秀" drawer (original artwork)
 *
 *   Design rules after user feedback: (1) no control that does nothing — every
 *   button has a real effect; (2) white backgrounds; (3) never read or write the
 *   host DOM. All artwork is ORIGINAL vector work; no commercial IM assets are
 *   bundled, copied or referenced.
 */
window.__ModuleLoader__.load({
  id: 'dsh-skin-im2005',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const SKIN_SOURCE = 'dsh-skin-im2005'
    const Z = 2147483000

    /* ASSET:BEGIN */
    // 公开版：不内联任何第三方图片，全部走内置原创 SVG。
    const SHOW_SRC = ''
    const PENGUIN_SRC = ''
    const AVATAR_SRC = ''
    /* ASSET:END */

    /* ------------------------------------------------------------------ */
    const IM_BLUE = '#316ac5'
    const IM_BLUE_DEEP = '#2b5aa8'
    const IM_EDGE = '#7f9db9'
    const IM_EDGE_STRONG = '#4a6b8f'
    const SUN = '"SimSun","宋体","MS Song",-apple-system,BlinkMacSystemFont,sans-serif'
    const pair = (v) => ({ light: v, dark: v })

    const SHAPE = {
      '--dsw-radius-xs': pair('0px'),
      '--dsw-radius-sm': pair('0px'),
      '--dsw-radius-md': pair('0px'),
      '--dsw-radius-lg': pair('0px'),
      '--dsw-radius-xl': pair('0px'),
      '--dsw-radius-panel': pair('0px'),
      '--dsw-font-family': pair(SUN),
      '--dsw-font-family-brand': pair(SUN),
      '--dsw-elevation-panel': pair('var(--dsw-elevation-stroke)'),
      '--dsw-elevation-prominent': pair('var(--dsw-elevation-stroke)'),
      '--dsw-elevation-soft': pair('var(--dsw-elevation-stroke)'),
      '--dsw-focus-ring-width': pair('1px'),
    }
    const stroke = (w) => pair('0 0 0 ' + w + ' var(--dsw-elevation-stroke-color)')

    const STD = {
      '--dsw-elevation-stroke': stroke('1px'),
      '--dsw-elevation-stroke-color': { light: IM_EDGE, dark: '#5b6b85' },
      '--dsw-focus-ring-color': { light: IM_BLUE, dark: '#4f7fbf' },
      '--dsw-alias-border-l1': { light: '#e6e6e6', dark: '#31363d' },
      '--dsw-alias-border-l2': { light: '#cfcfcf', dark: '#3c434c' },
      '--dsw-alias-border-l3': { light: '#a9b7c6', dark: '#46536a' },
      '--dsw-alias-border-l4': { light: IM_EDGE, dark: '#5b6b85' },
      '--dsw-alias-bg-base': { light: '#ffffff', dark: '#12151a' },
      '--dsw-alias-bg-layer-1': { light: '#ffffff', dark: '#1b1f24' },
      '--dsw-alias-bg-layer-2': { light: '#f7f7f7', dark: '#20252b' },
      '--dsw-alias-bg-layer-3': { light: '#ffffff', dark: '#16191d' },
      '--dsw-alias-bg-module-platform': { light: '#f2f2f2', dark: '#232830' },
      // 官方用它填充 Windows 标题栏条带 + 左侧栏（[data-windows-titlebar] .frame /
      // .sidebarCol）。改成浅蓝，左侧工作区就有 IM 好友列表那种浅蓝底了。
      '--dsw-specific-sidebar-fill': { light: '#e2ebf8', dark: '#1b232e' },
      '--dsw-alias-scrollbar-bg-l1': { light: '#dcdcdc', dark: '#3a3f46' },
      '--dsw-alias-scrollbar-bg-l2': { light: '#dcdcdc', dark: '#3a3f46' },
      '--dsw-alias-scrollbar-hover-l1': { light: IM_BLUE, dark: '#4f7fbf' },
      '--dsw-alias-scrollbar-hover-l2': { light: IM_BLUE, dark: '#4f7fbf' },
      '--dsw-alias-interactive-bg-hover': { light: '#dbe7f7', dark: '#4f7fbf33' },
      '--dsw-alias-interactive-bg-active': { light: '#c3d9f5', dark: '#4f7fbf55' },
      '--dsw-alias-brand-primary': { light: IM_BLUE, dark: '#4f7fbf' },
      '--dsw-alias-brand-text': { light: '#1f4a8f', dark: '#6f9fe0' },
      '--dsw-alias-link': { light: '#0b4fa8', dark: '#7fb0ff' },
      '--dsw-alias-state-business-primary': { light: IM_BLUE, dark: '#4f7fbf' },
      '--dsw-alias-state-business-tertiary': { light: '#e6eefa', dark: '#1e2b3d' },
      '--dsw-alias-button-primary-fill': { light: IM_BLUE, dark: '#3a6fc4' },
      '--dsw-alias-button-primary-hover': { light: '#245a9f', dark: '#4f7fbf' },
      '--dsw-alias-button-primary-dimmed': { light: '#a9c2e2', dark: '#33455f' },
      '--dsw-alias-button-elevated-fill': { light: '#f2f2f2', dark: '#2a2f36' },
      '--dsw-alias-button-floating-fill': { light: '#ffffff', dark: '#2a2f36' },
      '--dsw-alias-button-floating-hover': { light: '#f2f7fd', dark: '#343a42' },
    }

    const STRONG = Object.assign({}, STD, {
      '--dsw-elevation-stroke': stroke('2px'),
      '--dsw-elevation-stroke-color': { light: IM_EDGE_STRONG, dark: '#6b7d99' },
      '--dsw-focus-ring-color': { light: IM_BLUE_DEEP, dark: '#6f9fe0' },
      '--dsw-alias-border-l1': { light: '#dcdcdc', dark: '#2b3038' },
      '--dsw-alias-border-l2': { light: '#b8b8b8', dark: '#363c45' },
      '--dsw-alias-border-l3': { light: '#8fa3ba', dark: '#46536a' },
      '--dsw-alias-border-l4': { light: IM_EDGE_STRONG, dark: '#6b7d99' },
      '--dsw-alias-bg-layer-2': { light: '#f0f0f0', dark: '#20252b' },
      '--dsw-alias-bg-module-platform': { light: '#eaeaea', dark: '#232830' },
      '--dsw-specific-sidebar-fill': { light: '#d3e0f2', dark: '#161d26' },
      '--dsw-alias-interactive-bg-hover': { light: '#c9dcf3', dark: '#4f7fbf44' },
      '--dsw-alias-interactive-bg-active': { light: '#a8c6ea', dark: '#4f7fbf66' },
      '--dsw-alias-brand-primary': { light: IM_BLUE_DEEP, dark: '#4f7fbf' },
      '--dsw-alias-state-business-primary': { light: IM_BLUE_DEEP, dark: '#4f7fbf' },
      '--dsw-alias-state-business-tertiary': { light: '#d7e5f8', dark: '#1a2534' },
      '--dsw-alias-button-primary-fill': { light: IM_BLUE_DEEP, dark: '#3a6fc4' },
      '--dsw-alias-button-primary-hover': { light: '#1f4a8f', dark: '#4f7fbf' },
    })

    const VARIANT_NAMES = ['关', '标准', '浓烈']
    // THEME_PREFERENCES —— 直接从主题包读出的合法值（默认 system）
    const THEME_PREFS = ['light', 'dark', 'system']
    const THEME_LABELS = { light: '浅色', dark: '深色', system: '跟随系统' }
    const tokensFor = (v) => Object.assign({}, SHAPE, v === 2 ? STRONG : STD)

    /* ================================================================== *
     * Store
     * ================================================================== */
    const store = {
      scheme: 'light',
      variant: 1,
      live: false,
      diag: '',
      cycle: null,
      setVariant: null,
      pinned: false,                    // 形象秀 面板固定
      balance: { open: false, state: 'idle', amount: '', note: '' },
      // 账户头像 URL（来自一方 getProfile 接口，和界面左下角那个圆形头像同源）
      accountAvatar: '',
      // 账户身份（同样来自 getProfile）
      accountName: '',
      accountContact: '',
      // getState() 给出的官方链接：用量页 / 充值页
      links: { usageUrl: '', topUpUrl: '' },
      // 主题偏好与正文字号（来自 ctx.theme 快照，setTheme/setFontSize 是唯一写入口）
      themePref: 'system',
      fontSize: 14,
      setBalance: null,
      queryBalance: null,
      togglePin: null,
      listeners: new Set(),
      set(patch) {
        Object.assign(store, patch)
        store.listeners.forEach((fn) => { try { fn() } catch (err) {} })
      },
      subscribe(fn) {
        store.listeners.add(fn)
        return () => { store.listeners.delete(fn) }
      },
    }

    const useStore = () => {
      const [, force] = React.useState(0)
      React.useEffect(() => store.subscribe(() => force((n) => n + 1)), [])
      return store
    }

    /* ------------------------------------------------------------------ *
     * Isolation switch. Set to false to run the THEME LAYER ONLY, with no slot
     * registrations at all — the switch to flip when bisecting a boot failure
     * that might come from injecting into host-owned slots.
     * ------------------------------------------------------------------ */
    const DECORATIONS = true

    /* ------------------------------------------------------------------ *
     * IM-style gradient for the Windows title-bar strip.
     *
     * On win32 DSH renders its own title bar: the frame gets
     *   padding-top: var(--dsh-windows-titlebar-height)
     * and paints that strip with a ::before whose background is
     *   var(--dsw-specific-sidebar-fill)
     * — the SAME token that fills the sidebar column, so overriding the token
     * would turn the whole sidebar blue and make its labels unreadable.
     * Instead we target the strip only.
     *
     * Selectors use CSS-module LOCAL-NAME suffixes (the real names are
     * `<hash>_frame` / `<hash>_logoRow`), so a rebuild that changes the hash
     * still matches. Any rule that fails to match is a harmless no-op — this
     * file can never crash the host.
     * ------------------------------------------------------------------ */

    // 档案卡占用的高度。CSS 的「下推」和卡片自身的 height 都用它，
    // 一个数字两处使用，避免两边漂移。
    const PROFILE_CARD_H = 92

    // 会话栏顶部条的背景色：直接取自用户给的色样，逐行采样出的竖向渐变
    //   顶部 #e8ecfa → 中部 #dcdbfc → 底部 #c2c0fa（平均 #cfd0f0，是浅紫蓝）
    const HEADER_TINT = 'linear-gradient(180deg,#e9edfa 0%,#dcdbfc 45%,#c1bffa 100%)'

    const CHROME_CSS = [
      // 1) the strip itself: the frame's ::before is exactly the top bar
      //    ⚠️ 必须用 :has([class*="_centerCol"]) 把范围锁到 **layout 的 frame**：
      //    实测 `_frame` 这个类名被 6 个包共用（chat / subagent / user-questions /
      //    documentpreview / sidebar-browser / layout），只用 [class*="_frame"] 会
      //    把渐变和 padding 打到聊天卡片、提问卡、子代理面板上（真踩过）。
      //    `_centerCol` 只有 layout 有，是可靠的锚点。
      '[data-windows-titlebar] [class*="_frame"]:has([class*="_centerCol"])::before{',
      'background:linear-gradient(180deg,#4a8ede 0%,#2f6fc4 48%,#1f5aa8 100%)!important;',
      'border-bottom:1px solid #1a4a8c!important}',
      // 2) the content seat on the strip (where the app menu lives): white text,
      //    the way a 2005 title bar looked. _leadingSeat is the real class
      //    (<hash>_leadingSeat) holding the top-left content at top:11px/left:88px.
      '[data-windows-titlebar] [class*="_leadingSeat"]{color:#fff!important;',
      'text-shadow:0 1px 0 rgba(0,0,0,.35)}',
      '[data-windows-titlebar] [class*="_leadingSeat"] *{color:#fff!important}',
      '[data-windows-titlebar] [class*="_leadingSeat"] svg{fill:currentColor!important}',
      // 3) the sidebar brand row sits just below the strip; keep it from
      //    visually cutting the bar in two
      '[data-windows-titlebar] [class*="_logoRow"]{background:transparent!important}',
      // 4) IM 好友分组风：左侧工作区分组行 / 会话行 / 选中条
      //    _projectRow / _sessionRow / _selected 是 host 的 CSS-module 局部名后缀
      //    （实测 _projectRow/_sessionRow 只有 dsh-client-ui-workspace 在用）
      //    工作区名行：**白底**（用户要求，原来是蓝渐变），只留一条分隔线
      '[data-windows-titlebar] [class*="_projectRow"]{',
      'background:#ffffff!important;',
      'border-bottom:1px solid #b9cde8!important}',
      '[data-windows-titlebar] [class*="_projectRow"] [class*="_title"]{',
      'font-weight:bold!important;color:#000000!important}',
      '[data-windows-titlebar] [class*="_sessionRow"]{border-radius:0!important}',
      '[data-windows-titlebar] [class*="_sessionRow"]:hover{background:#cfe3fa!important}',
      // 选中条：IM 的饱和蓝 + 白字（compound selector，避免误伤别处的 _selected）
      '[data-windows-titlebar] [class*="_sessionRow"][class*="_selected"]{',
      'background:#316ac5!important;color:#ffffff!important}',
      '[data-windows-titlebar] [class*="_sessionRow"][class*="_selected"] [class*="_time"],',
      '[data-windows-titlebar] [class*="_sessionRow"][class*="_selected"] [class*="_meta"]{',
      'color:#dbe7f7!important}',
      '[data-windows-titlebar] [class*="_sessionRow"][class*="_selected"] *{color:#ffffff!important}',
      // 4b) 工作区下面的任务列表 → **白底**（IM 好友列表那种"上面灰蓝表头、下面白列表"）
      //     __list 这个类名被 6 个包共用，所以用 :has([data-row-key]) 精确锁定：
      //     data-row-key（workspace: / session:）只有工作区列表的行才有。
      //
      //     background-clip:content-box 是关键：白底**只填内容区**，不填 padding。
      //     _list 的 padding-right 正是右侧那条滚动/拖拽栏 —— 不裁的话它会一起变白，
      //     把工作区列表的白和主会话的白连成一片（用户报的正是这个）。
      //     裁掉后那一条露出侧栏的浅蓝，滚动条轨道也单独染回浅蓝。
      //     ⚠️⚠️ `[class*="_list"]` 是**子串匹配**，它同时命中 `_list` 和 **`_listArea`**
      //     （`_list` 是 `_listArea` 的前缀子串）！而 `_listArea` 带
      //     `margin-right: -edge-inset`，会往右多伸出一截、盖住右侧那条滚动/拖拽栏，
      //     且它右侧没有 padding，`content-box` 裁不掉 → 白底一路连到主会话。
      //     所以必须显式排除 `_listArea`。这是和 `_frame` 撞 6 个包同一类错误：
      //     **子串选择器天生会越界，必须验证它到底命中了谁。**
      '[class*="_list"]:has([data-row-key]):not([class*="_listArea"]){',
      'background:#ffffff!important;',
      'background-clip:content-box!important}',
      '[class*="_list"]:has([data-row-key]):not([class*="_listArea"])::-webkit-scrollbar-track{',
      'background:var(--dsw-specific-sidebar-fill,#e2ebf8)!important}',
      // 列表底部那道渐隐原本渐变到侧栏蓝，改成渐变到白，免得白底下面拖一条蓝尾巴
      '[class*="_list"]:has([data-row-key]):not([class*="_listArea"]) [class*="_fade"]{',
      'background:linear-gradient(to bottom,transparent,#ffffff)!important}',
      // 4c) 行左符号：宿主**自带**一个右向三角（hover 时才显示，展开时自动转 ▼），
      //     把文件夹图标永久藏掉、三角永久显示 —— 就是 IM 好友列表的分组箭头。
      //     ⚠️ _chevron 被 14 个包共用、_folder 被 2 个包共用，
      //        所以**必须**限定在 [class*="_projectRow"] 之内。
      '[data-windows-titlebar] [class*="_projectRow"] [class*="_folder"]{display:none!important}',
      '[data-windows-titlebar] [class*="_projectRow"] [class*="_chevron"]{',
      'display:inline-flex!important;color:#1f4a8f!important}',
      // 4d) 列表内所有文字 → **黑色宋体**（用户要求）。
      //     ⚠️ 必须排除选中行：它是 IM 蓝底白字，被"全部黑字"打掉就看不清了。
      //     规则故意不带 [data-windows-titlebar] 前缀，让 4) 里那几条选中态规则
      //     （带前缀、且更具体）继续赢。
      '[class*="_list"]:has([data-row-key]){font-family:"SimSun","宋体",serif!important}',
      '[class*="_list"]:has([data-row-key]) *{font-family:"SimSun","宋体",serif!important}',
      '[class*="_list"]:has([data-row-key]) [class*="_projectRow"],',
      '[class*="_list"]:has([data-row-key]) [class*="_sessionRow"]:not([class*="_selected"]){',
      'color:#000000!important}',
      '[class*="_list"]:has([data-row-key]) [class*="_sessionRow"]:not([class*="_selected"]) *{',
      'color:#000000!important}',
      // 5) 右侧边栏与左侧工作区同色（浅蓝）。
      //    只挂在 [data-sidebar-right-open]（"已展开"标记）上，绝不用
      //    [data-sidebar-right-panel] —— 后者是常驻属性，收起后依然存在，
      //    会把那块蓝底留在原位置**挡住内容**（用户报的正是这个）。
      //    内部容器设透明，让面板自身的浅蓝透出来。
      '[data-sidebar-right-open]{',
      'background:var(--dsw-specific-sidebar-fill,#e2ebf8)!important}',
      '[data-sidebar-right-open] [data-dockkit-host],',
      '[data-sidebar-right-open] [data-dockkit-pane]{background:transparent!important}',
      // 5b) 会话栏顶部条（含标题行 + 对话/轨迹 tabs）的背景色 —— 用户指定的色样。      //     结构（从真实 JSX 读出）：
      //       <header className="…header" data-window-drag>
      //         <div data-conversation-header-leading>
      //         {renderSlot("conversation.session.header")}   ← 标题行 + tabs
      //       </header>
      //     所以 header[data-window-drag] 一次覆盖整条。用标签名+语义属性，
      //     不依赖 hash 类名。
      'header[data-window-drag]{background:' + HEADER_TINT + '!important}',
      // 5c) 消息「抬头」→ IM 聊天记录风：**名字 + 时间**（用户参照的截图效果）
      //
      //     结构（从 dsh-client-ui-chat 的真实 JSX 读出）：
      //       <div class="…_actions" data-clock="start|end">
      //         <span class="…_timeStart | …_timeEnd">14:28:14</span>   ← 宿主已渲染
      //         [复制][分支]…
      //       </div>
      //     两处区别（决定了覆盖范围）：
      //       · 用户 / steering：clock="start"，抬头行在气泡**上方**（_timeStart）
      //       · AI 回答：宿主用 clock="end"，且它在 **TurnTailNodeView**（turn-tail 节点）
      //         里，排在回答**下方**（_timeEnd）—— 所以规则必须同时覆盖 start 和 end，
      //         否则 AI 那边一个字都不显示（用户报过）。
      //     宿主自己的 CSS 让这些行 hover 才出现；我们要它们常显。
      //     名字用 ::before 注入（::before 在 flex 行里是第一个 item，时间本就是第一个
      //     子元素 → 天然排成「名字 时间」）。
      '[data-chat-flow-kind] [class*="_actions"][data-clock]{',
      'opacity:1!important;align-items:baseline!important;gap:6px!important}',
      '[data-chat-flow-kind]:is([data-chat-flow-kind="user"],[data-chat-flow-kind="steering"]) ',
      '[class*="_actions"][data-clock]::before{',
      'content:var(--dsh-im-username,"我");',
      'font:bold 12px/1 "SimSun","宋体",serif;color:#1a7a1a;white-space:nowrap}',
      '[data-chat-flow-kind]:not([data-chat-flow-kind="user"]):not([data-chat-flow-kind="steering"]) ',
      '[class*="_actions"][data-clock]::before{',
      'content:"DeepSeek";',
      'font:bold 12px/1 "SimSun","宋体",serif;color:#316ac5;white-space:nowrap}',
      // 时间：IM 记录里的灰 + 宋体（start / end 两种都要）
      '[data-chat-flow-kind] [class*="_timeStart"],',
      '[data-chat-flow-kind] [class*="_timeEnd"]{',
      'color:#6b6b6b!important;font-family:"SimSun","宋体",serif!important;',
      'font-size:12px!important;white-space:nowrap}',
      // 抬头常显，但按钮平时压暗、悬停才亮 —— 不吵。
      // ⚠️ [class*="_action"] 会连 _actions 一起命中（子串！），所以要 :not 掉容器。
      '[data-chat-flow-kind] [class*="_actions"][data-clock] [class*="_action"]:not([class*="_actions"]){',
      'opacity:.3;transition:opacity .12s var(--ds-ease-in-out)}',
      '[data-chat-flow-kind] [class*="_actions"][data-clock]:hover [class*="_action"]{',
      'opacity:1}',
      // 6) 给侧栏顶部的档案卡腾位置：把侧栏内容整体下推，而不是盖在宿主行上面。
      //    :has(> [class*="_logoRow"]) 精确锁定「直接包含侧栏 logo 行的那个容器」，
      //    不会误伤其它 div。纯 CSS，匹配不上只是空操作。
      //
      //    :not([class*="_collapsed"]) 是关键：侧栏收起后必须撤掉这条下推，
      //    否则折叠轨道上会留一块 92px 高的蓝底（用户报的"收进去后背景没跟着收"）。
      '[data-windows-titlebar] div:has(> [class*="_logoRow"]):not([class*="_collapsed"]){',
      'padding-top:' + PROFILE_CARD_H + 'px!important}',
      // 7) 档案卡是 fixed 浮层，不会跟着侧栏一起收；侧栏收起时直接隐藏它。
      //    用我自己的类名（.dsh-skin-im2005-profile）做目标，不依赖宿主内部结构。
      '[data-windows-titlebar]:has([class*="_collapsed"]) .dsh-skin-im2005-profile{',
      'display:none!important}',
    ].join('')

    /* ------------------------------------------------------------------ *
     * Containment: every component we hand to the host is wrapped in an error
     * boundary. A throw inside OUR render must never be able to take down the
     * host package that owns the slot (e.g. dsh-client-ui-conversation).
     * ------------------------------------------------------------------ */
    const withBoundary = (label, Inner) => {
      class SkinBoundary extends React.Component {
        constructor(props) {
          super(props)
          this.state = { err: null }
        }
        static getDerivedStateFromError(err) { return { err } }
        componentDidCatch(err) {
          console.warn('[dsh-skin-im2005] ' + label + ' 渲染失败，已隔离', err)
        }
        render() {
          if (this.state.err) {
            return h('span', {
              title: String((this.state.err && this.state.err.message) || this.state.err),
              style: { font: '10px/1 "SimSun",sans-serif', color: '#8a1f1f' },
            }, '⚠ ' + label)
          }
          return h(Inner, this.props)
        }
      }
      SkinBoundary.displayName = 'SkinBoundary(' + label + ')'
      return SkinBoundary
    }

    /* ================================================================== *
     * Shared styling helpers
     * ================================================================== */
    const BAR = {
      light: { bg: 'linear-gradient(180deg,#4a8ede 0%,#2f6fc4 45%,#1f5aa8 100%)', edge: '#1a4a8c', text: '#ffffff', dim: '#d6e4f7' },
      dark: { bg: 'linear-gradient(180deg,#2b3a4d 0%,#20293a 45%,#18202c 100%)', edge: '#0f1620', text: '#dfe4ea', dim: '#9fb0c4' },
    }
    const FACE = { light: '#f2f2f2', dark: '#2a2f36' }
    const INK = { light: '#1a1a1a', dark: '#dfe4ea' }
    const faceOf = (s) => FACE[s] || FACE.light
    const bevel = (face, edge, darkFace) =>
      'inset 1px 1px 0 0 #ffffff, inset -1px -1px 0 0 #9a9a92, 0 0 0 1px ' + edge

    const Clock = ({ style, prefix }) => {
      const [now, setNow] = React.useState(() => new Date())
      React.useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 30000)
        return () => clearInterval(id)
      }, [])
      const t = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0')
      return h('span', { style: style }, (prefix || '') + t)
    }

    /**
     * Mascot. Uses the embedded assets/penguin.png when present; otherwise falls
     * back to the ORIGINAL SVG drawn below, so removing the inline asset never
     * leaves a hole (and the plugin has no unlicensed artwork baked in by default).
     */
    const Penguin = ({ size }) => {
      const px2 = size || 16
      if (PENGUIN_SRC) {
        return h('img', {
          src: PENGUIN_SRC,
          alt: '',
          draggable: false,
          'aria-hidden': true,
          style: {
            display: 'block', width: px2, height: px2,
            objectFit: 'contain', flex: '0 0 auto', pointerEvents: 'none',
          },
        })
      }
      /* MASCOT:BEGIN */
      // 公开版吉祥物：原创的「显示器 + 对话气泡」，不含任何厂商吉祥物特征。
      const px = (x, y, w, hh, fill, key) => h('rect', { key, x, y, width: w, height: hh, fill })
      return h('svg', {
        width: px2, height: px2, viewBox: '0 0 16 16',
        shapeRendering: 'crispEdges', 'aria-hidden': true, style: { display: 'block', flex: '0 0 auto' },
      },
        px(2, 2, 12, 1, '#111', 'a'), px(1, 3, 14, 7, '#111', 'b'),
        px(2, 4, 12, 5, '#dfe9f7', 'c'),
        px(4, 5, 7, 1, IM_BLUE, 'd'), px(4, 6, 1, 1, IM_BLUE, 'e'), px(4, 7, 5, 1, IM_BLUE, 'f'),
        px(3, 10, 10, 1, '#111', 'g'),
        px(6, 11, 4, 1, '#111', 'h'), px(4, 12, 8, 1, '#111', 'i'),
      )
      /* MASCOT:END */
    }

    const CycleButton = ({ s, width }) => h('button', {
      type: 'button',
      title: '点击循环：关 → 标准 → 浓烈（实时生效）',
      onClick: () => { try { if (s.cycle) s.cycle() } catch (err) {} },
      style: {
        display: 'flex', alignItems: 'center', gap: 5,
        minWidth: width || 76, height: 20, padding: '0 8px', margin: 0, border: 'none',
        background: s.variant === 0 ? faceOf(s.scheme) : IM_BLUE,
        color: s.variant === 0 ? INK[s.scheme] || INK.light : '#ffffff',
        font: '11px/1 "SimSun","宋体",sans-serif', cursor: 'pointer',
        boxShadow: bevel(faceOf(s.scheme), IM_EDGE),
      },
    }, [h(Penguin, { key: 'p', size: 12 }), h('span', { key: 't' }, '皮肤 ' + VARIANT_NAMES[s.variant])])

    /* ================================================================== *
     * 1. IM blue gradient title bar -> conversation.session.header
     * ================================================================== */
    const QqTitleBar = () => {
      const s = useStore()
      const p = BAR[s.scheme] || BAR.light
      const ctrl = (key, label, title, onClick) => h('button', {
        key, type: 'button', title, onClick,
        style: {
          width: 16, height: 14, padding: 0, margin: 0, border: 'none',
          background: faceOf(s.scheme), color: '#1a1a1a',
          font: '9px/1 "SimSun",sans-serif', cursor: 'pointer',
          boxShadow: bevel(faceOf(s.scheme), p.edge),
        },
      }, label)

      return h('div', {
        className: 'dsh-skin-im2005-titlebar',
        style: {
          display: 'flex', alignItems: 'center', gap: 6,
          width: '100%', boxSizing: 'border-box', height: 24, padding: '0 4px 0 8px',
          background: p.bg, borderBottom: '1px solid ' + p.edge,
          color: p.text, font: 'bold 12px/1 "SimSun","宋体",sans-serif', userSelect: 'none',
        },
      },
        h(Penguin, { key: 'p', size: 14 }),
        h('span', { key: 't' }, '发送消息'),
        h('span', { key: 'sp', style: { flex: '1 1 auto' } }),
        h('span', { key: 'v', style: { fontWeight: 'normal', fontSize: 11, color: p.dim } },
          'IM2005 · ' + VARIANT_NAMES[s.variant] + ' · ',
          h(Clock, { key: 'c' })),
        ctrl('off', '✕', '关闭本皮肤（可再点下方按钮开启）', () => {
          try { if (s.setVariant) s.setVariant(0) } catch (err) {}
        }),
      )
    }

    /* ================================================================== *
     * 2. Tool bar -> conversation.input.dock   (list slot)
     *
     * Two controls, both real:
     *   余额        calls the first-party account Remote
     *               (ctx.remote.account.getBalance + accountClientMetadata)
     *   形象秀 固定   pins the 形象秀 panel open
     * ================================================================== */

    const moneySymbol = (currency) => (currency === 'USD' ? '$' : '¥')
    const groupDigits = (int) => int.replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')

    // Faithful to the official formatBalance rules in ui-settings-account:
    // 0 -> ¥0.00 · |x| < 0.01 -> <¥0.01 · negatives · grouped digits · round DOWN.
    const formatMoney = (raw, symbol) => {
      const s = String(raw == null ? '' : raw).trim()
      const m = /^(-?)(\d+)(?:\.(\d*))?$/.exec(s)
      if (!m) return symbol + s
      const neg = m[1] === '-'
      const int = m[2]
      const fracFull = m[3] || ''
      const frac = (fracFull + '00').slice(0, 2)
      if (/^0*$/.test(int) && /^0*$/.test(fracFull)) return symbol + '0.00'
      const tiny = /^0*$/.test(int) && /^0*$/.test(frac)
      if (tiny) return (neg ? '-' : '<') + symbol + '0.01'
      return (neg ? '-' : '') + symbol + groupDigits(int) + '.' + frac
    }

    // Mirrors the host's accountClientMetadata(locale, version).
    const accountMetadata = (localeOverride) => {
      let version = ''
      try {
        const w = window
        version = w.__DSH_CLIENT_VERSION__ ||
          (w.__DSH_BOOT__ && (w.__DSH_BOOT__.clientVersion || w.__DSH_BOOT__.version)) || ''
      } catch (err) {}
      let locale = localeOverride
      if (!locale) { try { locale = navigator.language } catch (err) {} }
      return {
        version: String(version || '0.2.0-rc.2'),
        locale: String(locale || 'zh-CN'),
        timezoneOffsetSeconds: -new Date().getTimezoneOffset() * 60,
      }
    }

    const QqToolBar = () => {
      const s = useStore()
      const face = faceOf(s.scheme)
      const b = s.balance
      const dark = s.scheme === 'dark'

      const btn = (key, label, title, onClick, primary) => h('button', {
        key, type: 'button', title, onClick,
        style: {
          minWidth: 62, height: 20, padding: '0 9px', margin: 0, border: 'none',
          background: primary ? IM_BLUE : face,
          color: primary ? '#ffffff' : (INK[s.scheme] || INK.light),
          font: '11px/1 "SimSun","宋体",sans-serif', cursor: 'pointer',
          boxShadow: bevel(face, IM_EDGE),
        },
      }, label)

      return h('div', {
        className: 'dsh-skin-im2005-toolbar',
        style: {
          display: 'flex', alignItems: 'center', gap: 5, height: 26, padding: '0 6px',
          borderTop: '1px solid ' + IM_EDGE,
          // 浅蓝色底（深色模式下用深蓝，避免刺眼）
          background: dark ? '#243247' : '#dbe7f7',
          font: '11px/1 "SimSun","宋体",sans-serif', userSelect: 'none',
        },
      },
        h('span', {
          key: 'lb',
          style: { color: dark ? '#9fb0c4' : '#2f4f7f', marginRight: 2, fontWeight: 'bold' },
        }, 'IM2005'),
        // 余额按钮是 toggle：面板开着就关掉，关着才去查询
        btn('bal',
          b.state === 'loading' ? '查询中…' : (b.open ? '关闭余额' : '余额'),
          b.open ? '关闭余额窗口' : '查询账户剩余余额',
          () => {
            try {
              if (s.balance.open) s.setBalance({ open: false })
              else if (s.queryBalance) s.queryBalance()
            } catch (err) {}
          },
          b.state === 'ok'),
        btn('pin', s.pinned ? '形象秀 固定' : '形象秀 未固定',
          s.pinned ? '点击取消固定（面板可以收起）' : '点击固定 形象秀 面板',
          () => { try { if (s.togglePin) s.togglePin() } catch (err) {} }, s.pinned),
      )
    }

    /* ================================================================== *
     * 2b. Balance dialog -> shell.overlay (list slot)
     * ================================================================== */
    const QqBalanceDialog = () => {
      const s = useStore()
      const b = s.balance
      if (!b.open) return null
      const face = faceOf(s.scheme)
      return h('div', {
        className: 'dsh-skin-im2005-balance',
        style: {
          position: 'fixed', right: 16, bottom: 104, zIndex: Z, width: 236,
          background: '#ffffff', border: '1px solid ' + IM_EDGE,
          boxShadow: '0 2px 8px rgba(0,0,0,.28)',
          font: '12px/1.5 "SimSun","宋体",sans-serif', color: '#1a1a1a',
        },
      },
        h('div', {
          key: 'tb',
          style: {
            display: 'flex', alignItems: 'center', gap: 4, height: 22, padding: '0 2px 0 8px',
            background: 'linear-gradient(180deg,#4a8ede,#1f5aa8)', color: '#ffffff',
            fontWeight: 'bold',
          },
        }, [
          h(Penguin, { key: 'p', size: 14 }),
          h('span', { key: 't', style: { flex: '1 1 auto' } }, '余额查询'),
          h('button', {
            key: 'x', type: 'button', title: '关闭',
            onClick: () => { try { if (s.setBalance) s.setBalance({ open: false }) } catch (err) {} },
            style: {
              width: 16, height: 16, padding: 0, margin: 0, border: 'none',
              background: face, color: '#1a1a1a', font: '9px/1 SimSun',
              cursor: 'pointer', boxShadow: bevel(face, '#1a4a8c'),
            },
          }, '✕'),
        ]),
        h('div', { key: 'bd', style: { padding: '10px 12px' } }, [
          h('div', {
            key: 'amt',
            style: {
              fontSize: 20, fontWeight: 'bold',
              color: b.state === 'ok' ? '#0b4fa8' : b.state === 'error' ? '#8a1f1f' : '#6b6b6b',
            },
          }, b.state === 'loading' ? '查询中…' : (b.amount || '—')),
          b.note
            ? h('div', {
              key: 'note',
              style: { marginTop: 6, fontSize: 11, color: '#7a7a7a', wordBreak: 'break-all' },
            }, b.note)
            : null,
        ]),
      )
    }

    /* ================================================================== *
     * 3. Skin intensity cycler -> conversation.composer.dock
     * ================================================================== */
    const QqSkinControl = () => {
      const s = useStore()
      // 只有**主题层失败**时才会渲染那条徽标，所以颜色只需考虑失败态
      const tone = '#8a1f1f'
      return h('div', {
        className: 'dsh-skin-im2005-control',
        style: {
          display: 'flex', alignItems: 'center', gap: 6, height: 26,
          padding: '0 4px', margin: '4px 0 0 0',
          font: '11px/1 "SimSun","宋体",sans-serif', userSelect: 'none',
        },
      },
        // The chrome stylesheet lives HERE, not in the title-bar component:
        // conversation.session.header turned out to be un-registrable in
        // 0.2.0-rc.2, so a stylesheet mounted there never reached the DOM.
        // This slot (the composer dock) is proven to mount, so the top bar
        // gradient works even when other slots are unavailable.
        //
        // 只有皮肤开启时才注入：「皮肤 关」必须回到原生外观，否则顶部/侧栏
        // 还是蓝的，用户会以为开关坏了。
        //
        // 账号名以 CSS 变量注入，供消息抬头行的 ::before（content: var(...)）使用：
        //   · CSS 不能自己拿到 JS 数据，但 content 支持 var()，所以这条路走得通；
        //   · 名字里的 " 和 \ 必须转义，否则整条规则会坏掉。
        h('style', {
          key: 'chrome',
          children: s.variant === 0 ? '' : CHROME_CSS + (
            s.accountName
              ? ':root{--dsh-im-username:"' +
                String(s.accountName).replace(/[\\"]/g, '\\$&') + '"}'
              : ''
          ),
        }),
        h(CycleButton, { key: 'b', s }),
        // 诊断徽标：**只在主题层失败时**出现（用户要求去掉平时那行 token/槽位信息，
        // 它太占地方）。但"失败绝不静默"这条设计保留 —— 失败时仍显红条，
        // 悬停看完整原因，同时 console 也有一条 error。
        s.diag.indexOf('失败') >= 0 ? h('span', {
          key: 'diag',
          style: {
            padding: '2px 6px', color: '#ffffff', background: tone,
            font: '10px/1 "SimSun",sans-serif', maxWidth: 380,
            overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
          },
          title: s.diag,
        }, s.diag) : null,
      )
    }

    /* ================================================================== *
     * 4. Top-strip chrome -> shell.leading
     *
     * `shell.leading` (the seat on the strip, real class `<hash>_leadingSeat`)
     * turned out to be a SINGLE slot owned by the host's application menu, so
     * shadowing it would delete the 应用/编辑 menu. This chrome therefore rides
     * `shell.overlay` (a list slot) as a fixed, click-through strip centred on
     * the Windows title bar — leaving the host menu untouched.
     * ================================================================== */
    const QqStripChrome = () => {
      const s = useStore()
      return h('div', {
        className: 'dsh-skin-im2005-strip',
        style: {
          position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
          height: 'var(--dsh-windows-titlebar-height, 42px)',
          display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px',
          pointerEvents: 'none', userSelect: 'none', zIndex: Z,
          font: 'bold 12px/1 "SimSun","宋体",sans-serif', color: '#ffffff',
          textShadow: '0 1px 0 rgba(0,0,0,.35)', whiteSpace: 'nowrap',
        },
      },
        h(Penguin, { key: 'p', size: 14 }),
        // 用户指定：这一行改成 聊天窗标题那种写法
        h('span', { key: 't' }, '与 DeepSeek Harness 聊天中...'),
      )
    }

    /* ================================================================== *
     * 4b. Session-header actions -> conversation.session.header.actions (list)
     *     IM-style window controls. Both buttons do something real.
     * ================================================================== */
    const QqHeaderActions = () => {
      const s = useStore()
      const face = faceOf(s.scheme)
      const ctrl = (key, label, title, onClick, primary) => h('button', {
        key, type: 'button', title, onClick,
        style: {
          minWidth: 18, height: 16, padding: '0 4px', margin: 0, border: 'none',
          background: primary ? IM_BLUE : face,
          color: primary ? '#ffffff' : (INK[s.scheme] || INK.light),
          font: '10px/1 "SimSun",sans-serif', cursor: 'pointer',
          boxShadow: bevel(face, IM_EDGE),
        },
      }, label)

      return h('div', {
        className: 'dsh-skin-im2005-header-actions',
        style: {
          display: 'inline-flex', alignItems: 'center', gap: 3,
          padding: '0 2px', font: '11px/1 "SimSun","宋体",sans-serif', userSelect: 'none',
        },
      },
        ctrl('t', 'IM', '循环皮肤档位：关 → 标准 → 浓烈', () => {
          try { if (s.cycle) s.cycle() } catch (err) {}
        }, s.variant !== 0),
        ctrl('x', '✕', '关闭本皮肤', () => {
          try { if (s.setVariant) s.setVariant(0) } catch (err) {}
        }),
      )
    }

    /* ================================================================== *
     * 4c. IM 档案卡 -> sidebar.footer.action (list)  —— 侧栏底部
     *
     * 曾经注册到 sidebar.panellist（侧栏顶部），但那是「主面板注册表」而不是内容区，
     * 会导致 layout.selectPanel 抛未捕获异常、应用无法启动。侧栏没有「顶部内容」槽，
     * 所以卡片只能安全地待在 footer.action。
     * ================================================================== */
    const SIG_KEY = 'dsh-skin-im2005.signature'
    // 个人空间 里那块自由编辑的「任务清单 / 提醒栏」，同样存在 localStorage
    const TODO_KEY = 'dsh-skin-im2005.todo'
    // 默认为空 —— 不再塞「旧版界面 · IM2005」这种填充文字（用户觉得突兀）
    const DEFAULT_SIG = ''
    // 老版本会把这段默认填充文字写进 localStorage；加载时一次性清掉
    const LEGACY_DEFAULT_SIG = '旧版界面 · IM2005'

    // 原创太阳等级图标（IM 的等级符号用太阳/月亮/星星）
    const Sun = ({ size, key: k }) => {
      const rays = []
      for (let i = 0; i < 8; i++) {
        rays.push(h('g', { key: 'r' + i, transform: 'rotate(' + (i * 45) + ' 8 8)' },
          h('rect', { x: 7, y: 0.6, width: 2, height: 3, fill: '#f5b400' })))
      }
      return h('svg', {
        key: k, width: size || 13, height: size || 13, viewBox: '0 0 16 16',
        'aria-hidden': true, style: { display: 'block', flex: '0 0 auto' },
      }, rays.concat([
        h('circle', { key: 'c', cx: 8, cy: 8, r: 4.2, fill: '#ffcc33', stroke: '#d99a00', strokeWidth: 1 }),
      ]))
    }

    const QqProfileCard = () => {
      const s = useStore()
      const face = faceOf(s.scheme)
      const dark = s.scheme === 'dark'

      const [sig, setSig] = React.useState(() => {
        try {
          const raw = window.localStorage.getItem(SIG_KEY)
          if (raw === LEGACY_DEFAULT_SIG) {          // 迁移旧的填充默认值
            window.localStorage.removeItem(SIG_KEY)
            return ''
          }
          return raw || ''
        } catch (err) { return '' }
      })
      const [editing, setEditing] = React.useState(false)
      const [draft, setDraft] = React.useState('')

      // 从事件取值而不是闭包里的 draft：不依赖"onChange 之后一定已重渲染"的时序
      const save = (valueFromEvent) => {
        const raw = valueFromEvent === undefined ? draft : valueFromEvent
        const v = String(raw == null ? '' : raw).slice(0, 60).trim() || DEFAULT_SIG
        setSig(v)
        setEditing(false)
        try { window.localStorage.setItem(SIG_KEY, v) } catch (err) {}
      }

      // 固定 50×50 的头像框：无论图片什么比例/是否加载成功，框都不会变形或跳动
      const avatar = AVATAR_SRC
        ? h('img', {
          src: AVATAR_SRC, alt: '', draggable: false,
          style: { display: 'block', width: '100%', height: '100%', objectFit: 'cover' },
        })
        : h(Penguin, { size: 46 })

      return h('div', {
        className: 'dsh-skin-im2005-profile',
        style: {
          // 浮层放在侧栏顶部（工作区标题行之上）。不是"盖"上去：CHROME_CSS 里
          // 用 padding-top 把侧栏内容整体下推了同样的高度，所以是"插进去"。
          position: 'fixed',
          left: 0, top: 'var(--dsh-windows-titlebar-height, 42px)',
          width: 'var(--dsh-windows-sidebar-width, 240px)',
          height: PROFILE_CARD_H, boxSizing: 'border-box',
          zIndex: Z - 1,
          // 只有签名那一处接收点击，其余点击穿透，不挡宿主的行
          pointerEvents: 'none',
          padding: '6px 8px',
          background: dark ? 'linear-gradient(180deg,#243247,#1c2836)' : 'linear-gradient(180deg,#f2f7fe,#dbe7f7)',
          borderBottom: '1px solid ' + IM_EDGE,
          font: '11px/1.4 "SimSun","宋体",sans-serif',
          color: dark ? '#dfe4ea' : '#1a1a1a', userSelect: 'none',
        },
      },
        h('div', { key: 'row', style: { display: 'flex', gap: 6, alignItems: 'flex-start' } }, [
          h('div', {
            key: 'av',
            style: {
              width: 50, height: 50, boxSizing: 'border-box',
              border: '1px solid ' + IM_EDGE, background: '#ffffff', padding: 1,
              overflow: 'hidden', flex: '0 0 auto', lineHeight: 0,
            },
          }, avatar),
          h('div', { key: 'col', style: { flex: '1 1 auto', minWidth: 0 } }, [
            h('div', { key: 'st', style: { display: 'flex', alignItems: 'center', gap: 4 } }, [
              h('span', {
                key: 'dot',
                style: {
                  width: 7, height: 7, background: '#21a121', border: '1px solid #14690f',
                  display: 'inline-block', flex: '0 0 auto',
                },
              }),
              h('span', { key: 'on', style: { color: dark ? '#7fd47f' : '#1a7a1a', fontWeight: 'bold' } }, '在线'),
              h('span', { key: 'sp', style: { flex: '1 1 auto' } }),
              h(Sun, { key: 's1' }), h(Sun, { key: 's2' }), h(Sun, { key: 's3' }),
            ]),
          ]),
        ]),

        // 个性签名：点一下即可编辑，回车保存（存 localStorage）
        editing
          ? h('input', {
            key: 'edit',
            autoFocus: true,
            value: draft,
            maxLength: 60,
            onChange: (e) => setDraft(e.target.value),
            onKeyDown: (e) => {
              if (e.key === 'Enter') save(e.target && e.target.value)
              else if (e.key === 'Escape') setEditing(false)
            },
            // 失焦 = 取消编辑，不写盘。只有回车才保存 —— 否则误点一下就会把
            // 草稿写进 localStorage，之后再改默认值也删不掉（这个坑真踩过）。
            onBlur: () => setEditing(false),
            style: {
              marginTop: 5, width: '100%', boxSizing: 'border-box',
              border: '1px solid ' + IM_EDGE, background: '#ffffff', color: '#1a1a1a',
              font: '11px/1.4 "SimSun","宋体",sans-serif', padding: '1px 3px',
              pointerEvents: 'auto',        // 卡片容器是 none，这里要能输入
            },
          })
          : h('div', {
            key: 'sig',
            title: sig ? '点击编辑个性签名（回车保存，Esc 取消）' : '点击设置个性签名（回车保存）',
            onClick: () => { setDraft(sig); setEditing(true) },
            style: {
              marginTop: 5, padding: '1px 3px', cursor: 'text',
              border: '1px dashed transparent',
              // 有签名才显示；没有时只留一个很淡的占位提示，不塞填充文字
              color: sig ? (dark ? '#c8d2de' : '#2f4f7f') : (dark ? '#5a6675' : '#9aa8bd'),
              fontSize: sig ? 11 : 10,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              pointerEvents: 'auto',        // 卡片容器是 none，只有签名可点
            },
          }, sig || '+ 签名'),
      )
    }

    /* ================================================================== *
     * 5. Sidebar brand mark -> sidebar.brand.mark
     * ================================================================== */
    const QqBrandMark = () => h('span', {
      className: 'dsh-skin-im2005-brandmark',
      title: 'IM2005 皮肤',
      style: { display: 'inline-flex', alignItems: 'center', padding: '0 2px' },
    }, h(Penguin, { size: 16 }))

    /* ================================================================== *
     * 5. Sidebar footer -> sidebar.footer.action  (status + live clock)
     * ================================================================== */
    const QqFooterStatus = () => {
      const s = useStore()
      return h('div', {
        className: 'dsh-skin-im2005-footer',
        style: {
          display: 'flex', alignItems: 'center', gap: 4,
          height: 20, padding: '0 6px', margin: '2px 0',
          background: faceOf(s.scheme), boxShadow: bevel(faceOf(s.scheme), IM_EDGE),
          font: '11px/1 "SimSun","宋体",sans-serif',
          color: INK[s.scheme] || INK.light, userSelect: 'none', whiteSpace: 'nowrap',
        },
      },
        h(Penguin, { key: 'p', size: 12 }),
        h('span', { key: 'o', style: { color: s.scheme === 'dark' ? '#5fbf5f' : '#1a7a1a' } }, '在线'),
        h('span', { key: 'c', style: { color: '#7a7a7a' } }, h(Clock, { key: 'k' })),
      )
    }

    /* ================================================================== *
     * 6. "形象秀" drawer -> shell.overlay  (original artwork, real controls)
     * ================================================================== */
    // Original stylised avatar on a stage backdrop. Drawn from primitives only.
    const ShowAvatar = () => h('svg', {
      viewBox: '0 0 120 150', width: '100%', height: 'auto',
      style: { display: 'block' }, 'aria-hidden': true,
    },
      h('defs', { key: 'd' },
        h('linearGradient', { id: 'im2005stage', x1: '0', y1: '0', x2: '0', y2: '1' },
          h('stop', { offset: '0%', stopColor: '#3f7fd0' }),
          h('stop', { offset: '100%', stopColor: '#1c3f70' }))),
      h('rect', { key: 'bg', x: 0, y: 0, width: 120, height: 150, fill: 'url(#im2005stage)' }),
      // stage lights
      h('circle', { key: 'l1', cx: 24, cy: 20, r: 4, fill: '#ffe9a8', opacity: 0.9 }),
      h('circle', { key: 'l2', cx: 96, cy: 20, r: 4, fill: '#ffe9a8', opacity: 0.9 }),
      h('rect', { key: 'l3', x: 0, y: 96, width: 120, height: 2, fill: '#8fc0ff', opacity: 0.5 }),
      h('rect', { key: 'l4', x: 0, y: 108, width: 120, height: 1, fill: '#8fc0ff', opacity: 0.35 }),
      // hair back
      h('ellipse', { key: 'hair', cx: 60, cy: 46, rx: 30, ry: 34, fill: '#2b2f6b' }),
      h('rect', { key: 'hair2', x: 30, y: 46, width: 60, height: 46, fill: '#2b2f6b' }),
      // face
      h('ellipse', { key: 'face', cx: 60, cy: 48, rx: 22, ry: 25, fill: '#f7d9c4' }),
      h('ellipse', { key: 'eye1', cx: 51, cy: 48, rx: 3.4, ry: 4.4, fill: '#22303f' }),
      h('ellipse', { key: 'eye2', cx: 69, cy: 48, rx: 3.4, ry: 4.4, fill: '#22303f' }),
      h('circle', { key: 'gl1', cx: 52, cy: 46.5, r: 1.1, fill: '#ffffff' }),
      h('circle', { key: 'gl2', cx: 70, cy: 46.5, r: 1.1, fill: '#ffffff' }),
      h('path', { key: 'mouth', d: 'M55 58 q5 4 10 0', stroke: '#b4635e', strokeWidth: 1.6, fill: 'none', strokeLinecap: 'round' }),
      h('circle', { key: 'bl1', cx: 46, cy: 56, r: 3.6, fill: '#f0a8a0', opacity: 0.55 }),
      h('circle', { key: 'bl2', cx: 74, cy: 56, r: 3.6, fill: '#f0a8a0', opacity: 0.55 }),
      // body
      h('path', { key: 'body', d: 'M38 92 q22 -12 44 0 l6 58 h-56 z', fill: '#e8eef8' }),
      h('path', { key: 'collar', d: 'M52 92 l8 10 l8 -10', stroke: '#9fb4cd', strokeWidth: 1.4, fill: 'none' }),
      h('rect', { key: 'skirt', x: 34, y: 132, width: 52, height: 18, fill: '#3a5b96' }),
      h('rect', { key: 'plate', x: 8, y: 132, width: 104, height: 14, fill: '#0d1c30', opacity: 0.45 }),
      h('text', { key: 'plateT', x: 60, y: 143, textAnchor: 'middle', fontSize: 9, fill: '#dbe7f7', fontFamily: 'SimSun, serif' }, 'IM2005'))

    /* ================================================================== *
     * 6b. 聊天窗右侧那一列（对方形象 / 个人空间 / 我的形象）
     *
     * 完全照着 聊天窗右侧做：三段**可折叠**面板。折叠头是真交互（点击开合），
     * 段内只放真控件（固定面板 / 余额查询 / 档位切换），不放"点了没反应"的假条目。
     *
     * 位置上的物理限制：宿主不给插件"新增一列"的能力，所以这是一个贴右边缘的
     * 固定面板，会盖住右侧边栏与会话区右侧一部分 —— 因此保留竖排折叠标签，可随时收。
     * ================================================================== */

    // 两张立绘共用同一个固定画框 —— 立绘是竖长条(336×547)、头像是正方形(192×192)，
    // 若各自 height:auto 两者高度会差很多。统一画框 + objectFit:contain 让它们
    // **占据完全相同的尺寸**，图片在框内等比缩放（长边贴边，短边留白）。
    const FIG_BOX_H = 168
    const FIG_BOX = {
      width: '100%', height: FIG_BOX_H, boxSizing: 'border-box',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#ffffff', border: '1px solid ' + IM_EDGE, padding: 2,
      marginBottom: 4, overflow: 'hidden',
    }
    const FIG_IMG = { display: 'block', maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }

    // IM 风格的小节头：▾ 展开 / ▸ 收起（真交互，点击开合）
    // IM 风格的小节头：▾ 展开 / ▸ 收起（真交互，点击开合）
    //   style     —— 作用在外层包裹（用来 flex:1 撑开、或 marginTop:auto 压到底部）
    //   bodyStyle —— 作用在内容区（用来让内容区也撑开，好让里面的 textarea 长满）
    const QqSection = ({ title, open, onToggle, children, style, bodyStyle }) => h('div', {
      style: Object.assign({ borderBottom: '1px solid ' + IM_EDGE }, style || {}),
    },
      h('button', {
        key: 'h', type: 'button', title: open ? '收起该栏' : '展开该栏',
        onClick: onToggle,
        style: {
          display: 'flex', alignItems: 'center', gap: 4, width: '100%',
          height: 20, padding: '0 5px', margin: 0, border: 'none', cursor: 'pointer',
          background: 'linear-gradient(180deg,#e2ecfa,#c6d8ef)', color: '#1f4a8f',
          font: '11px/1 "SimSun","宋体",sans-serif', fontWeight: 'bold', textAlign: 'left',
          // 面板容器是 pointer-events:none，所以小节头要显式接收点击
          pointerEvents: 'auto',
        },
      }, [
        h('span', { key: 'a', style: { width: 9, textAlign: 'center' } }, open ? '▾' : '▸'),
        h('span', { key: 't' }, title),
      ]),
      open ? h('div', {
        key: 'b',
        style: Object.assign({ padding: 5 }, bodyStyle || {}),
      }, children) : null,
    )

    // 这一列的宽度。面板宽度与"给宿主腾位"的 padding 共用同一个数字，不会漂移。
    const COL_W = 176
    const COL_TAB_W = 22

    const QqShowColumn = () => {
      const s = useStore()
      const [openLocal, setOpenLocal] = React.useState(false)
      // 固定 = 工具条里的「形象秀 固定」按钮把整列钉住
      const open = s.pinned || openLocal
      // 三个小节的展开状态（各自独立，点击小节头切换）
      const [sec, setSec] = React.useState({ figure: true, zone: true, mine: true })
      const flip = (k) => setSec(Object.assign({}, sec, { [k]: !sec[k] }))
      // 个人空间 里那块自由编辑的任务清单/提醒栏。内容只放**组件本地 state**，
      // 不进 store —— 否则每敲一个字都要重渲染整列。落盘直接写 localStorage。
      const [todo, setTodo] = React.useState(() => {
        try { return window.localStorage.getItem(TODO_KEY) || '' } catch (err) { return '' }
      })
      const saveTodo = (v) => {
        setTodo(v)
        try { window.localStorage.setItem(TODO_KEY, v) } catch (err) {}
      }
      const face = faceOf(s.scheme)

      // 关键：**既腾出真实位置、又不破坏拖拽**。
      //
      // 做法来自读宿主的布局源码（AppFrame）：
      //   · 列宽 = gridTemplateColumns: `${sidebar}px minmax(400px,1fr) minmax(0px,rightbarMax)`
      //     —— 中间列是 1fr，会自动吸收空出来的宽度；
      //   · viewport = frame.getBoundingClientRect().width（**border-box**）→ padding 不影响它。
      //
      // 所以：
      //   ① 给 frame 加 padding-right → 中间列让出这个宽度、右侧边栏整体左移，
      //      整行仍排满（不溢出），右边正好空出来给本列 —— **谁都不被遮挡**；
      //   ② 但拖拽条的 left 是 JS 用那个（不变的）border-box 宽度算的，
      //      所以必须**视觉补偿同样的距离**，否则它会错位到右侧边栏内部。
      //      拖拽是 dx 增量式的，位移不影响拖拽数学。
      //
      // ⚠️ ①②必须**成对出现、距离相同**（下面的 assert 锁住了这个不变量），
      //    只做①就会出现用户报过的「拖拽没了」。
      const pad = open ? COL_W : COL_TAB_W
      const reserve =
        '[data-windows-titlebar] [class*="_frame"]:has([class*="_centerCol"]){' +
        'padding-right:' + pad + 'px!important}' +
        '[data-windows-titlebar] [class*="_handle"][data-side="rightbar"]{' +
        'transform:translateX(-' + pad + 'px)}'

      if (!open) {
        return h('div', { key: 'root', style: { display: 'contents' } }, [
          h('style', { key: 'reserve', children: reserve }),
          h('button', {
            key: 'tab', type: 'button', title: '展开 形象秀 面板',
            className: 'dsh-skin-im2005-col',
            onClick: () => setOpenLocal(true),
            style: {
              position: 'fixed', right: 0, top: 140, zIndex: Z,
              width: COL_TAB_W, height: 74, padding: 0, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(180deg,#4a8ede,#1f5aa8)', color: '#ffffff',
              font: '11px/1.15 "SimSun","宋体",sans-serif', boxShadow: bevel(face, '#1a4a8c'),
              pointerEvents: 'auto',
            },
          }, ['Q', 'Q', '秀'].map((c, i) => h('div', { key: i }, c))),
        ])
      }

      // 段内的小按钮（IM 里那种扁扁的浅灰块）；extra 用来覆盖样式（比如并排两个）
      const mini = (key, label, title, onClick, primary, extra) => h('button', {
        key, type: 'button', title, onClick,
        style: Object.assign({
          display: 'block', width: '100%', height: 20, margin: '0 0 4px',
          padding: '0 6px', border: 'none', cursor: 'pointer', textAlign: 'left',
          background: primary ? IM_BLUE : '#eef3fb',
          color: primary ? '#ffffff' : '#1f4a8f',
          font: '11px/1 "SimSun","宋体",sans-serif',
          boxShadow: bevel(face, IM_EDGE),
          // 面板容器是 pointer-events:none，所以按钮要显式接收点击
          pointerEvents: 'auto',
        }, extra || {}),
      }, label)

      return h('div', { key: 'root', style: { display: 'contents' } },
        h('style', { key: 'reserve', children: reserve }),
        h('div', {
        key: 'panel',
        className: 'dsh-skin-im2005-col',
        style: {
          position: 'fixed', right: 0,
          top: 'var(--dsh-windows-titlebar-height, 42px)', bottom: 0,
          width: COL_W, zIndex: Z,
          background: '#ffffff', borderLeft: '1px solid ' + IM_EDGE,
          font: '11px/1.4 "SimSun","宋体",sans-serif', color: '#1a1a1a',
          display: 'flex', flexDirection: 'column', overflowY: 'auto',
          // 容器对指针透明：宿主的右栏拖拽条即使被本列视觉覆盖也能正常拖动。
          // 只有按钮设 pointerEvents:auto，所以本列的控件照样能点。
          pointerEvents: 'none',
        },
      },
        // 顶部蓝条（IM 面板标题）
        h('div', {
          key: 'tb',
          style: {
            display: 'flex', alignItems: 'center', gap: 4, flex: '0 0 auto',
            height: 20, padding: '0 2px 0 7px',
            background: 'linear-gradient(180deg,#4a8ede,#1f5aa8)', color: '#ffffff',
            fontWeight: 'bold',
          },
        }, [
          h('span', { key: 't', style: { flex: '1 1 auto' } }, '形象秀'),
          h('button', {
            key: 'x', type: 'button',
            title: s.pinned ? '取消固定并收起' : '收起面板',
            onClick: () => {
              setOpenLocal(false)
              if (s.pinned) { try { if (s.togglePin) s.togglePin() } catch (err) {} }
            },
            style: {
              width: 16, height: 14, padding: 0, margin: 0, border: 'none',
              background: face, color: '#1a1a1a', font: '9px/1 SimSun',
              cursor: 'pointer', boxShadow: bevel(face, '#1a4a8c'),
              pointerEvents: 'auto',
            },
          }, '✕'),
        ]),

        // --- 对方形象 ---
        h(QqSection, {
          key: 'figure', title: '对方形象', open: sec.figure, onToggle: () => flip('figure'),
        }, [
          h('div', { key: 'art', style: FIG_BOX }, SHOW_SRC
            ? h('img', { src: SHOW_SRC, alt: '形象秀', style: FIG_IMG })
            : h(ShowAvatar, {})),
          mini('pin', s.pinned ? '取消固定面板' : '固定面板',
            '让这一列常驻，不随收起消失',
            () => { try { if (s.togglePin) s.togglePin() } catch (err) {} }, s.pinned),
        ]),

        // --- 个人空间 = 账户区 + 自由编辑的任务清单/提醒栏 ---
        // 刻意不放「余额查询」「皮肤档位」：那两个在底部工具条与顶栏已经有了，
        // 放这里就是重复。这里只放不重复的真功能（都基于核实过的一方接口）。
        // flex:1 让这一段吃掉剩下的高度，里面的 textarea 随之长满。
        h(QqSection, {
          key: 'zone', title: '个人空间', open: sec.zone, onToggle: () => flip('zone'),
          // 只有展开时才吃剩余高度；收起时回到自适应高度，
          // 否则收起来会留一大块空白、把「我的形象」顶不上去。
          style: sec.zone
            ? { flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column' }
            : { flex: '0 0 auto' },
          bodyStyle: { flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column' },
        }, [
          // 账户身份（getProfile）
          h('div', {
            key: 'who',
            title: [s.accountName, s.accountContact].filter(Boolean).join(' · '),
            style: {
              marginBottom: 4, color: '#1f4a8f', fontWeight: 'bold',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            },
          }, s.accountName || s.accountContact || '账户未登录'),
          // 外观偏好（ctx.theme.setTheme 是唯一写偏好入口）
          mini('theme', '外观：' + (THEME_LABELS[s.themePref] || s.themePref),
            '循环切换 浅色 → 深色 → 跟随系统',
            () => { try { if (s.cycleTheme) s.cycleTheme() } catch (err) {} }),
          // 正文字号（ctx.theme.setFontSize 是唯一写字号入口，10–22）
          h('div', { key: 'fs', style: { display: 'flex', gap: 4, marginBottom: 4 } }, [
            mini('fsm', '字号 ' + s.fontSize + ' −', '减小正文字号（10–22）',
              () => { try { if (s.stepFontSize) s.stepFontSize(-1) } catch (err) {} },
              false, { width: '48%', margin: 0 }),
            mini('fsp', '字号 ' + s.fontSize + ' +', '增大正文字号（10–22）',
              () => { try { if (s.stepFontSize) s.stepFontSize(1) } catch (err) {} },
              false, { width: '48%', margin: 0 }),
          ]),
          // 官方链接（getState().links）——拿不到就不显示，不做假链接
          s.links.usageUrl
            ? mini('usage', '查看用量', '打开官方用量页',
              () => { try { if (s.openLink) s.openLink(s.links.usageUrl) } catch (err) {} })
            : null,
          s.links.topUpUrl
            ? mini('topup', '充值', '打开官方充值页',
              () => { try { if (s.openLink) s.openLink(s.links.topUpUrl) } catch (err) {} })
            : null,
          // 剩下的空间 → 自由编辑的「任务清单 / 提醒栏」。
          // 内容存 localStorage（key: TODO_KEY），输入即时保存，不经过 store。
          h('textarea', {
            key: 'todo',
            value: todo,
            placeholder: '写点待办 / 提醒…（自动保存）',
            spellCheck: false,
            'aria-label': '任务清单提醒栏',
            onChange: (e) => saveTodo(e && e.target ? e.target.value : ''),
            style: {
              flex: '1 1 auto', minHeight: 56, width: '100%', boxSizing: 'border-box',
              marginTop: 2, marginBottom: 0, resize: 'none', outline: 'none',
              border: '1px solid ' + IM_EDGE, background: '#ffffff', color: '#1a1a1a',
              font: '11px/1.5 "SimSun","宋体",sans-serif', padding: '3px 4px',
              // 面板容器是 pointer-events:none，输入框必须显式接管（否则点不进去）
              pointerEvents: 'auto',
            },
          }),
        ]),

        // --- 我的形象：用用户的头像图，尺寸与「对方形象」完全一致，
        //     并且用 marginTop:auto 把整段压在栏目最下方 ---
        h(QqSection, {
          key: 'mine', title: '我的形象', open: sec.mine, onToggle: () => flip('mine'),
          style: { marginTop: 'auto' },
        }, [
          h('div', { key: 'art', style: FIG_BOX }, s.accountAvatar
            // 优先用账户头像（"用户头像"），加载失败或未登录则回退
            ? h('img', {
              src: s.accountAvatar, alt: '我的形象', style: FIG_IMG,
              onError: () => { try { store.set({ accountAvatar: '' }) } catch (err) {} },
            })
            : (AVATAR_SRC
              ? h('img', { src: AVATAR_SRC, alt: '我的形象', style: FIG_IMG })
              : h(Penguin, { size: 150 }))),
          // 用户要求：头像下面不要任何文字（原来有「旧版界面 / 档位」和时钟）。
          // 时钟在这里去掉不影响功能 —— 侧栏底部、顶栏、档案卡都还有。
        ]),
      ))
    }

    /* ================================================================== *
     * Plugin module
     * ================================================================== */
    return {
      // Service-level injects. `remote` alone is NOT enough — the dotted
      // namespaces are SEPARATE services. Authoritative list, copied from
      // dsh-client-ui-settings-account (the package that actually calls this):
      //   ["slots","locale","remote","remote.account","remote.session","theme","configForms"]
      // Missing one throws: cannot get property "remote.account" without inject.
      inject: ['slots', 'theme', 'locale', 'remote', 'remote.account'],

      apply(ctx) {
        let layerDispose = null
        const dropLayer = () => { try { if (layerDispose) layerDispose() } catch (err) {} layerDispose = null }

        const applyLayer = () => {
          dropLayer()
          if (store.variant === 0) { store.set({ live: false, diag: '皮肤已关闭（原生界面）' }); return }
          const tokens = tokensFor(store.variant)
          try {
            layerDispose = ctx.theme.overrideTokens(SKIN_SOURCE, tokens)
            store.set({
              live: true,
              diag: '主题层 ✓ ' + VARIANT_NAMES[store.variant] + ' · ' + Object.keys(tokens).length + ' tokens',
            })
          } catch (err) {
            layerDispose = null
            const msg = '主题层失败: ' + ((err && err.message) || String(err))
            store.set({ live: false, diag: msg })
            console.warn('[dsh-skin-im2005]', msg)
          }
        }

        store.setVariant = (v) => { store.variant = ((v % 3) + 3) % 3; applyLayer() }
        store.cycle = () => store.setVariant(store.variant + 1)

        // ---- 形象秀 固定 ----
        store.togglePin = () => store.set({ pinned: !store.pinned })

        // ---- 外观：setTheme 是主题包文档里"唯一写偏好入口"，非法 id 会抛 ----
        store.cycleTheme = () => {
          try {
            const cur = store.themePref
            const i = THEME_PREFS.indexOf(cur)
            const next = THEME_PREFS[(i + 1) % THEME_PREFS.length]
            ctx.theme.setTheme(next)
            store.set({ themePref: next })     // theme/change 也会刷新，这里先给即时反馈
          } catch (err) {
            console.warn('[dsh-skin-im2005] setTheme 失败', err)
          }
        }

        // ---- 正文字号：setFontSize 是"唯一写字号入口"，范围 10..22 整数 ----
        store.stepFontSize = (delta) => {
          try {
            const next = Math.min(22, Math.max(10, (store.fontSize || 14) + delta))
            ctx.theme.setFontSize(next)
            store.set({ fontSize: next })
          } catch (err) {
            console.warn('[dsh-skin-im2005] setFontSize 失败', err)
          }
        }

        // ---- 打开官方链接（用量页 / 充值页），交给宿主的外链处理 ----
        store.openLink = (url) => {
          try {
            if (!url) return
            window.open(String(url), '_blank', 'noopener')
          } catch (err) {
            console.warn('[dsh-skin-im2005] 打开链接失败', err)
          }
        }

        // ---- 余额查询：走一方账户 Remote，不自己碰凭证 ----
        store.setBalance = (patch) => store.set({ balance: Object.assign({}, store.balance, patch) })
        store.queryBalance = async () => {
          store.setBalance({ open: true, state: 'loading', amount: '', note: '正在向账户服务查询…' })
          try {
            const api = ctx.remote && ctx.remote.account
            if (!api || typeof api.getBalance !== 'function') {
              throw new Error('ctx.remote.account 不可用（需在 dsh.client.inject 声明 @deepseek-ai/dsh-api-remotes）')
            }
            let loc = ''
            try { loc = ctx.locale.getSnapshot().active } catch (err) {}
            const meta = accountMetadata(loc)
            const result = await api.getBalance(meta)
            if (!result || result.ok !== true) throw new Error('账户服务返回失败（ok !== true）')
            const value = result.value
            if (value === null) {
              store.setBalance({ state: 'error', amount: '未登录', note: '账户未登录，余额不可用' })
              return
            }
            if (value.status !== 'ready') {
              store.setBalance({ state: 'error', amount: '查询失败', note: 'status = ' + String(value.status) })
              return
            }
            const wallets = Array.isArray(value.value) ? value.value : []
            const bonuses = Array.isArray(value.bonusWallets) ? value.bonusWallets : []
            const lines = wallets.map((w) =>
              formatMoney(w.balance, moneySymbol(w.currency)) + (w.currency ? ' ' + w.currency : ''))
            const bonusLines = bonuses
              .filter((w) => w && w.balance)
              .map((w) => '赠送 ' + formatMoney(w.balance, moneySymbol(w.currency)))
            store.setBalance({
              state: 'ok',
              amount: lines.length ? lines.join('  ') : '无余额记录',
              note: bonusLines.length ? bonusLines.join(' · ')
                : (wallets.length ? '' : '服务未返回余额条目'),
            })
          } catch (err) {
            store.setBalance({
              state: 'error',
              amount: '查询失败',
              note: String((err && err.message) || err),
            })
          }
        }
        applyLayer()
        ctx.effect(() => () => dropLayer())

        // ---- 账户信息：头像 / 身份 / 官方链接（用量页、充值页）----
        // 全部来自一方 account Remote；任何一步失败都静默降级，不影响其它功能。
        ctx.effect(() => {
          let cancelled = false
          ;(async () => {
            let loc = ''
            try { loc = ctx.locale.getSnapshot().active } catch (err) {}
            const api = ctx.remote && ctx.remote.account
            if (!api) return
            const meta = accountMetadata(loc)

            // 身份 + 头像
            try {
              if (typeof api.getProfile === 'function') {
                const r = await api.getProfile(meta)
                if (cancelled) return
                if (r && r.ok === true && r.value && r.value.status === 'ready' && r.value.value) {
                  const p = r.value.value
                  store.set({
                    accountName: p.name ? String(p.name) : '',
                    accountContact: p.contact ? String(p.contact) : '',
                    ...(p.avatarUrl ? { accountAvatar: String(p.avatarUrl) } : {}),
                  })
                }
              }
            } catch (err) { /* 未登录：保持内置头像与占位文案 */ }

            // 官方链接（用量页 / 充值页）
            try {
              if (typeof api.getState === 'function') {
                const r = await api.getState(meta)
                if (cancelled) return
                if (r && r.ok === true && r.value && r.value.links) {
                  const l = r.value.links
                  store.set({
                    links: {
                      usageUrl: l.usageUrl ? String(l.usageUrl) : '',
                      topUpUrl: l.topUpUrl ? String(l.topUpUrl) : '',
                    },
                  })
                }
              }
            } catch (err) { /* 拿不到链接就不显示那两个按钮 */ }
          })()
          return () => { cancelled = true }
        })

        ctx.effect(() => {
          const read = () => {
            try {
              const snap = ctx.theme.getTheme()
              return {
                scheme: (snap && snap.active && snap.active.colorScheme) || 'light',
                themePref: (snap && snap.preference) || 'system',
                fontSize: (snap && snap.fontSize) || 14,
              }
            } catch (err) { return { scheme: 'light', themePref: 'system', fontSize: 14 } }
          }
          store.set(read())
          const off = ctx.on('theme/change', () => store.set(read()))
          return () => { try { if (off) off() } catch (err) {} }
        })

        // DSH slot contract (recovered from the bundles): a slot is declared
        // `single`, `list`, `chain` or `keyed`. Only list/chain/keyed accept
        // additional registrations; a `single` slot already held by the host
        // throws "already has a registration at priority 0" unless you shadow it
        // with a lower priority. Everything below is a list slot — except the
        // brand mark, which is deliberately shadowed.
        const safe = (slot, id, comp, extra) => {
          try {
            const opts = Object.assign({ name: slot, id, order: 5 }, extra || {})
            ctx.slots.inject(slot, () => ctx.slots.register(opts, withBoundary(id, comp)))
            return true
          } catch (err) {
            console.warn('[dsh-skin-im2005] slot 不可用，已跳过: ' + slot, err)
            return false
          }
        }

        const slots = DECORATIONS ? [
          // list slots — proven to accept our content
          ['conversation.composer.dock', 'im2005-skin-control', QqSkinControl],
          ['shell.overlay', 'im2005-show', QqShowColumn],
          ['shell.overlay', 'im2005-strip', QqStripChrome],
          ['sidebar.footer.action', 'im2005-footer', QqFooterStatus],
          // list slot on the session header: IM window controls (─ 档位 ✕)
          ['conversation.session.header.actions', 'im2005-header-actions', QqHeaderActions],
          // list slot beside the input: 余额 / 形象秀固定 工具条（浅蓝底）
          ['conversation.input.dock', 'im2005-toolbar', QqToolBar],
          // ⚠️ 绝不能注册进 sidebar.panellist！它虽然 kind=list，但它是「主面板注册表」：
          // 往里注册的东西会被布局当成可切换面板，随后抛
          //   layout.selectPanel: main panel "im2005-profile" is not registered
          // 未捕获异常 → 整个客户端插件激活失败 → 应用起不来（真崩过两次）。
          //
          // 侧栏没有任何可放内容的 list 槽，所以卡片走 shell.overlay 浮层，
          // 由 CHROME_CSS 的 padding-top 把侧栏内容整体下推，视觉上"插"在工作区标题行之上。
          ['shell.overlay', 'im2005-profile', QqProfileCard],
          // list slot: 余额弹窗
          ['shell.overlay', 'im2005-balance', QqBalanceDialog],
          // single slot, but we WANT to replace the host's brand mark with our
          // penguin — the message says to shadow it with a lower priority
          ['sidebar.brand.mark', 'im2005-brand', QqBrandMark, { priority: -1 }],
        ] : []
        const ok = slots.filter(([a, b, c, d]) => safe(a, b, c, d)).map((r) => r[0])
        store.set({
          diag: store.diag + (DECORATIONS ? ' · slots ' + ok.length + '/' + slots.length : ' · 装饰层已关闭'),
        })
      },
    }
  },
})
