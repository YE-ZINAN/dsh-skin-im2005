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
    // 公开版：不内联任何第三方图片 / 音频，图片走内置原创 SVG。
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

    /**
     * 聊天抬头里的**绿名**（我的昵称）。默认「我」，空值也回落到「我」。
     * ⚠️ 这三个东西（常量 + 两个读写函数）必须写在"本地版专属功能"的分隔标记**外面**
     * —— 公开版也要用它们（昵称与提醒功能无关，曾被一起误切掉过）。
     * 另外：声明必须在 store 之前，store 初始化时会调 readNickname()。
     */
    const NICK_KEY = 'dsh-skin-im2005.nickname'
    const DEFAULT_NICK = '我'

    function readNickname() {
      try {
        const v = window.localStorage.getItem(NICK_KEY)
        return v === null || String(v).trim() === '' ? DEFAULT_NICK : String(v).slice(0, 20)
      } catch (err) { return DEFAULT_NICK }
    }

    function writeNickname(v) {
      try { window.localStorage.setItem(NICK_KEY, v) } catch (err) {}
    }

        // 公开版：本地专属的提醒功能已整体剥离。


    /* ================================================================== *
     * 美式八球引擎 —— 纯逻辑，不碰 DOM
     *
     * 建局 / 物理推进 / 规则判定 / 存档序列化全在这里，界面上只画它的快照。
     * 这样做是因为这个功能唯一会反复翻车的地方是"手感"和"规则"，而这两样
     * 都能在没有界面的情况下断言（见 test-skin-client.mjs「美式八球」一节）。
     *
     * 单位口径：抽象"英寸"。台面 100×50（真实 9 尺台 100"×50"），球半径 1.125"（直径 2.25"）。
     * 渲染时按比例缩放到 canvas。
     *
     * ⚠️ 三条防翻车铁律（都踩过或必然会踩）：
     *   ① 物理必须**固定步长**推进 —— 用帧间隔直接积分的模拟，帧率一变手感就变；
     *   ② 单帧推进时间必须**封顶** —— 窗口隐藏时 rAF 会暂停，回来那一刻的墙钟间隔
     *      可能是几分钟，不封顶就会看到球瞬移到台外；
     *   ③ 速度低于阈值必须**直接归零** —— 否则球永远在"慢慢爬"，判定停稳的代码
     *      永远不触发，存档也就永远不写。
     * ================================================================== */
    /* GAME-ENGINE:BEGIN */
    // 尺寸口径（都按**真实英寸**定，出处：Dr. Dave / RSB FAQ 的台面尺寸表 + 赛事球径）：
    //   台面内沿        100 × 50 英寸 —— 9 尺台（赛事标准）的台面
    //   球直径          2.25 英寸（57.15 mm，全尺寸统一）
    //   袋口吃球半径    2.7  英寸（真实袋口约 4.5–5 英寸宽，球心进这个半径就算落袋）
    // ⚠️ 球径是按 **7 尺 bar box（78×39 英寸）的比例**画的：真球在 100 寸台上只占 2.25%，
    //    在 78 寸台上占 2.9% —— 视觉上大 28%。9 尺台上球本来就显小（那是真实观感），
    //    但球房/手机游戏里常见的是 7 尺台，用户要的是那个观感，所以把球与袋口按同比例放大
    //    （袋/球比保持 1.88，手感不变）。
    const POOL = {
      W: 100, H: 50,          // 台面内沿（长 × 短）
      R: 1.44,                // 球半径（= 2.88 单位直径 ≈ 78 寸台配 2.25 寸球的视觉比例）
      POCKET_R: 2.7,          // 袋口吃球半径（球心进入这个半径就算落袋）
      POCKET_INSET: 1.6,      // 角袋沿库边的内缩
      DECEL: 26,              // 恒定减速度（单位/秒²）—— 台布滚动摩擦
      STOP: 1.1,              // 低于此速度直接归零（铁律 ③）
      MAX_SPEED: 130,         // 出杆速度上限（满力约走 2 个台长：v²/2a = 16900/52 ≈ 325 单位）
      BALL_REST: 0.94,        // 球-球恢复系数
      CUSHION_REST: 0.86,     // 球-库边恢复系数
      SUBSTEP: 1 / 240,       // 固定物理子步（铁律 ①）
      MAX_DT: 0.1,            // 单帧最多推进这么久（铁律 ②）
      HEAD_STRING: 0.25,      // 开球线：x = W × 0.25
      FOOT_SPOT: 0.75,        // 置球点：x = W × 0.75
    }
    // 6 个袋口：0/2/3/5 角袋，1/4 中袋（顺序固定；渲染与测试都用这个下标）
    const POOL_POCKETS = [
      { x: POOL.POCKET_INSET, y: POOL.POCKET_INSET },
      { x: POOL.W / 2, y: 0 },
      { x: POOL.W - POOL.POCKET_INSET, y: POOL.POCKET_INSET },
      { x: POOL.POCKET_INSET, y: POOL.H - POOL.POCKET_INSET },
      { x: POOL.W / 2, y: POOL.H },
      { x: POOL.W - POOL.POCKET_INSET, y: POOL.H - POOL.POCKET_INSET },
    ]
    const POOL_COLORS = {
      1: '#e8bb1c', 2: '#1b3f9c', 3: '#c1272d', 4: '#5b2a86', 5: '#e2661a', 6: '#12703a', 7: '#7a2f22',
      8: '#141414',
      9: '#e8bb1c', 10: '#1b3f9c', 11: '#c1272d', 12: '#5b2a86', 13: '#e2661a', 14: '#12703a', 15: '#7a2f22',
    }
    // 三角摆球：8 号在第 3 行正中，最后一行两个角一全一花（标准摆法）
    const POOL_RACK = [
      [1],
      [11, 2],
      [3, 8, 12],
      [13, 4, 14, 5],
      [6, 15, 7, 9, 10],
    ]
    const poolKind = (id) => (id === 0 ? 'cue' : id === 8 ? 'eight' : id < 8 ? 'solid' : 'stripe')
    const poolGroup = (id) => (id === 8 ? 'eight' : id < 8 ? 'solid' : 'stripe')

    const createPoolEngine = (cfg) => {
      const c = cfg || {}
      const W = c.W || POOL.W
      const H = c.H || POOL.H
      const R = c.R || POOL.R
      const pocketR = c.pocketR || POOL.POCKET_R
      const decel = c.decel === undefined ? POOL.DECEL : c.decel
      const stop = c.stop === undefined ? POOL.STOP : c.stop
      const maxSpeed = c.maxSpeed || POOL.MAX_SPEED
      const ballRest = c.ballRest === undefined ? POOL.BALL_REST : c.ballRest
      const cushRest = c.cushionRest === undefined ? POOL.CUSHION_REST : c.cushionRest
      const substep = c.substep || POOL.SUBSTEP
      const maxDt = c.maxDt || POOL.MAX_DT
      const startBest = c.best || 0

      let balls = []
      let game = null
      let score = null
      let facts = null          // 当前这一杆的"原始事实"（规则判定只看它）
      // 声音事件队列：物理每产生一次"撞击/落袋"就记一条，界面取走并出声。
      // 只记**强度**，不在这里放任何音频代码 —— 引擎要保持纯逻辑、可无界面断言。
      let events = []
      let message = ''
      let rnd = 1
      let dirty = true          // 有变化 → 界面重画

      const rand = () => { rnd = (rnd * 1103515245 + 12345) % 2147483648; return rnd / 2147483648 }

      const ball = (id) => balls.filter((b) => b.id === id)[0] || null
      const cue = () => ball(0)
      const moving = () => balls.some((b) => !b.in && (b.vx !== 0 || b.vy !== 0))
      const resting = () => !moving()
      const groupLeft = (grp) => balls.filter((b) => !b.in && b.id !== 0 && b.id !== 8 && poolGroup(b.id) === grp).length

      const newGame = (starter) => ({
        v: 1, phase: 'break', turn: starter || 0, groups: [null, null], open: true,
        inHand: true, behindLine: true, shots: [0, 0], winner: null,
      })

      // 摆球：母球在开球线中点，目标球三角摆开（带一点可复现的抖动）
      const rack = (starter, seed) => {
        rnd = (seed || 1) >>> 0 || 1
        balls = [{ id: 0, x: W * POOL.HEAD_STRING, y: H / 2, vx: 0, vy: 0, in: false }]
        const rowGap = Math.sqrt(3) * R + 0.02
        for (let r = 0; r < POOL_RACK.length; r++) {
          const row = POOL_RACK[r]
          for (let i = 0; i < row.length; i++) {
            const jx = (rand() - 0.5) * 0.02
            const jy = (rand() - 0.5) * 0.02
            balls.push({
              id: row[i],
              x: W * POOL.FOOT_SPOT + r * rowGap + jx,
              y: H / 2 + (i - (row.length - 1) / 2) * (2 * R + 0.02) + jy,
              vx: 0, vy: 0, in: false,
            })
          }
        }
        facts = null
        message = ''
        dirty = true
      }

      const reset = (o) => {
        const opt = o || {}
        game = newGame(opt.starter)
        if (!score) score = { wins: [0, 0], best: startBest }
        rack(game.turn, opt.seed || 1)
        placeCueAtDefault()
        return true
      }

      // 找一个不压球、且在（开球时）开球线之后的母球位置
      const freeSpot = (behind) => {
        const yMid = H / 2
        const cands = []
        for (let k = 0; k < 40; k++) {
          cands.push({ x: behind ? W * POOL.HEAD_STRING - k * (R + 0.3) : W * POOL.HEAD_STRING + k * (R + 0.3), y: yMid })
        }
        for (let k = 0; k < 60; k++) {
          cands.push({ x: behind ? W * 0.12 + (k % 6) * 2.2 : W * (0.2 + (k % 8) * 0.08), y: H * (0.2 + 0.6 * ((k / 8) % 1)) })
        }
        for (const p of cands) {
          if (p.x < R + 0.05 || p.x > W - R - 0.05 || p.y < R + 0.05 || p.y > H - R - 0.05) continue
          if (behind && p.x > W * POOL.HEAD_STRING) continue
          let ok = true
          for (const b of balls) {
            if (b.id === 0 || b.in) continue
            if (Math.hypot(b.x - p.x, b.y - p.y) < 2 * R + 0.05) { ok = false; break }
          }
          if (ok) return p
        }
        return { x: behind ? W * 0.12 : W * 0.5, y: yMid }
      }

      const placeCueAtDefault = () => {
        const cb = cue()
        if (!cb) return
        cb.in = false
        cb.vx = 0
        cb.vy = 0
        const p = freeSpot(!!game.behindLine && game.phase === 'break')
        cb.x = p.x
        cb.y = p.y
        dirty = true
      }

      // ---- 物理：一个子步 ----
      const integrate = (dt) => {
        for (const b of balls) {
          if (b.in) continue
          const sp = Math.hypot(b.vx, b.vy)
          if (sp > 0) {
            const ns = sp - decel * dt
            if (ns <= stop) { b.vx = 0; b.vy = 0 } else { const k = ns / sp; b.vx *= k; b.vy *= k }
          }
          b.x += b.vx * dt
          b.y += b.vy * dt
        }
      }

      const collideBalls = () => {
        const minD = 2 * R
        for (let i = 0; i < balls.length; i++) {
          const a = balls[i]
          if (a.in) continue
          for (let j = i + 1; j < balls.length; j++) {
            const b = balls[j]
            if (b.in) continue
            const dx = b.x - a.x
            const dy = b.y - a.y
            const d2 = dx * dx + dy * dy
            if (d2 >= minD * minD || d2 <= 1e-12) continue
            const d = Math.sqrt(d2)
            const nx = dx / d
            const ny = dy / d
            // 位置修正：先推开到刚好相切（否则会"粘"在一起反复触发碰撞）
            const overlap = (minD - d) / 2
            a.x -= nx * overlap
            a.y -= ny * overlap
            b.x += nx * overlap
            b.y += ny * overlap
            // 等质量弹性碰撞（沿法线交换，带恢复系数）
            const vn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny
            if (vn < 0) {
              const imp = -((1 + ballRest) * vn) / 2
              a.vx -= imp * nx
              a.vy -= imp * ny
              b.vx += imp * nx
              b.vy += imp * ny
              // 撞击强度 = 法向相对速度（音效按它给音量）
              events.push({ t: 'ball', v: -vn })
              if (facts) {
                const hitId = a.id === 0 ? b.id : b.id === 0 ? a.id : null
                if (hitId !== null && facts.firstHit === null) {
                  facts.firstHit = hitId
                  facts.contactAt = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
                }
              }
            }
          }
        }
      }

      const hitCushions = () => {
        for (const b of balls) {
          if (b.in) continue
          let hit = 0
          if (b.x < R) { b.x = R; if (b.vx < 0) { hit = Math.max(hit, -b.vx); b.vx = -b.vx * cushRest; b.vy *= 0.99 } }
          else if (b.x > W - R) { b.x = W - R; if (b.vx > 0) { hit = Math.max(hit, b.vx); b.vx = -b.vx * cushRest; b.vy *= 0.99 } }
          if (b.y < R) { b.y = R; if (b.vy < 0) { hit = Math.max(hit, -b.vy); b.vy = -b.vy * cushRest; b.vx *= 0.99 } }
          else if (b.y > H - R) { b.y = H - R; if (b.vy > 0) { hit = Math.max(hit, b.vy); b.vy = -b.vy * cushRest; b.vx *= 0.99 } }
          if (hit > 0) {
            events.push({ t: 'rail', v: hit })
            if (facts) {
              if (facts.firstHit !== null) facts.railsAfterContact = true
              facts.rails = true
            }
          }
        }
      }

      const checkPockets = () => {
        for (const b of balls) {
          if (b.in) continue
          for (let p = 0; p < POOL_POCKETS.length; p++) {
            const pk = POOL_POCKETS[p]
            if (Math.hypot(b.x - pk.x, b.y - pk.y) > pocketR) continue
            b.in = true
            b.vx = 0
            b.vy = 0
            b.pocket = p
            events.push({ t: 'pot', v: 1, id: b.id })
            if (facts) {
              facts.pocketed.push(b.id)
              if (b.id === 0) facts.cuePocketed = true
              }
            dirty = true
            break
          }
        }
      }

      // 母球能不能放在这里（自由球摆放 / 开球摆位共用）
      const canPlaceAt = (x, y) => {
        if (game.phase === 'over') return false
        if (x < R + 0.05 || x > W - R - 0.05 || y < R + 0.05 || y > H - R - 0.05) return false
        if (game.phase === 'break' && game.behindLine && x > W * POOL.HEAD_STRING) return false
        for (const b of balls) {
          if (b.id === 0 || b.in) continue
          if (Math.hypot(b.x - x, b.y - y) < 2 * R + 0.05) return false
        }
        return true
      }

      // ---- 规则 ----
      const respotEight = () => {
        const b = ball(8)
        if (!b) return
        b.in = false
        b.vx = 0
        b.vy = 0
        const p = freeSpot(false)
        b.x = Math.max(R + 0.05, Math.min(W - R - 0.05, W * POOL.FOOT_SPOT))
        b.y = p.y
        // 若置球点上压着别的球，沿长轴往脚库方向找空位
        for (let k = 0; k < 30; k++) {
          let ok = true
          for (const o of balls) {
            if (o.id === 8 || o.in) continue
            if (Math.hypot(o.x - b.x, o.y - b.y) < 2 * R + 0.05) { ok = false; break }
          }
          if (ok) break
          b.x = Math.min(W - R - 0.05, b.x + R)
        }
      }

      const endGame = (winner, why) => {
        game.phase = 'over'
        game.winner = winner
        game.inHand = false
        if (score) {
          score.wins[winner] = (score.wins[winner] || 0) + 1
          const n = game.shots[winner]
          if (!score.best || n < score.best) score.best = n
        }
        message = why
        dirty = true
      }

      const resolveShot = () => {
        const f = facts
        facts = null
        if (!f) return null
        const p = game.turn
        const opp = 1 - p
        const pocketed = f.pocketed.slice()
        const myGroup = game.groups[p]
        const onEight = !!myGroup && groupLeft(myGroup) === 0
        const eightIn = pocketed.indexOf(8) >= 0

        let foul = null
        // ① 接触是否合法
        if (f.cuePocketed) foul = '母球落袋'
        else if (f.firstHit === null) foul = '空杆：没碰到任何球'
        else if (onEight) { if (f.firstHit !== 8) foul = '该打 8 号球，却先碰到了别的球' }
        else if (myGroup) { if (poolGroup(f.firstHit) !== myGroup) foul = '先碰到了对方的球' }
        else if (f.firstHit === 8) foul = '台面开放时不能先碰 8 号球'
        // ② 无球碰库（只有在没有进球时才算犯规）
        if (!foul && !f.railsAfterContact && pocketed.length === 0) foul = '碰撞后既没进球、也没有球碰库'

        if (eightIn) {
          if (game.phase === 'break' && !foul) {
            // 房屋规则：开球进 8 号不算输赢，把 8 号摆回置球点继续打（写进 README）
            respotEight()
            const k = pocketed.indexOf(8)
            if (k >= 0) pocketed.splice(k, 1)
            message = '开球进 8 号：按本插件的规则摆回置球点，继续'
          } else {
            // 规则（2026-03-10 起）：**不用叫袋** —— 合法打进 8 号即胜
            const legalWin = !foul && onEight
            endGame(legalWin ? p : opp, legalWin
              ? (p === 0 ? '玩家 1' : '玩家 2') + ' 打进 8 号球，获胜'
              : (foul ? '犯规同时打进 8 号球' : (onEight ? '8 号球进袋但犯规' : '提前打进 8 号球')) +
                ' —— ' + (opp === 0 ? '玩家 1' : '玩家 2') + ' 获胜')
            return { kind: 'over', foul, pocketed, turn: game.turn, winner: game.winner, message }
          }
        }

        // 定组：开球后台面仍开放；之后的第一次合法进球决定花色
        if (!foul && pocketed.length) {
          if (game.phase === 'break') {
            game.phase = 'open'
            game.open = true
          } else if (!myGroup) {
            const grp = poolGroup(pocketed[0])
            if (grp !== 'eight') {
              game.groups[p] = grp
              game.groups[opp] = grp === 'solid' ? 'stripe' : 'solid'
              game.open = false
              game.phase = 'assigned'
              message = (p === 0 ? '玩家 1' : '玩家 2') + ' 打「' + (grp === 'solid' ? '全色 1-7' : '花色 9-15') + '」'
            }
          }
        }

        let keep = false
        if (!foul) {
          const mine = game.groups[game.turn]
          keep = mine ? pocketed.some((id) => poolGroup(id) === mine) : pocketed.length > 0
        }

        if (foul) {
          game.turn = opp
          game.inHand = true
          game.behindLine = false
          // ⚠️ 只有**母球真的落袋**才需要重新摆回台面。
          //    如果犯规跟母球无关（空杆 / 先碰错球 / 碰撞后没球碰库），母球必须留在原地 ——
          //    无条件摆回去的后果是"每犯规一次母球就飞回开球点"，而"没球碰库"这类犯规
          //    对新手极其常见（轻轻推一杆、没进也没碰库），体感就是"每次击球白球都回原位"
          //    （用户实测报的就是这个）。自由球状态下玩家本来就能自己拖母球，不需要替他搬。
          if (f.cuePocketed) placeCueAtDefault()
        } else if (!keep) {
          game.turn = opp
          game.inHand = false
          game.behindLine = false
          if (f.cuePocketed) placeCueAtDefault()
        } else {
          game.inHand = false
          game.behindLine = false
        }
        if (game.phase === 'break') game.phase = 'open'
        const head = foul ? ('犯规：' + foul + ' → ' + (opp === 0 ? '玩家 1' : '玩家 2') + ' 自由球')
          : keep ? '进球，继续'
            : '换 ' + (opp === 0 ? '玩家 1' : '玩家 2')
        if (!message || game.phase !== 'assigned') message = head
        dirty = true
        return { kind: foul ? 'foul' : keep ? 'continue' : 'pass', foul, pocketed, turn: game.turn, message }
      }

      // ---- 对外 ----
      const settleSync = (limit) => {
        let n = 0
        const max = limit || 20000
        while (moving() && n < max) { integrate(substep); collideBalls(); hitCushions(); checkPockets(); n++ }
        // 兜底：还在动就直接停住（极端情况宁可停死，也不要存档里带速度）
        if (moving()) for (const b of balls) { b.vx = 0; b.vy = 0 }
      }

      reset({ starter: 0, seed: 1 })

      return {
        // 建局
        reset,
        // 状态
        state: () => ({ phase: game.phase, turn: game.turn, groups: game.groups.slice(), open: game.open, inHand: game.inHand, behindLine: game.behindLine, shots: game.shots.slice(), winner: game.winner, message, moving: moving() }),
        snapshot: () => ({
          W, H, R, pocketR, pockets: POOL_POCKETS,
          balls: balls.map((b) => ({ id: b.id, x: b.x, y: b.y, vx: b.vx, vy: b.vy, in: b.in, kind: poolKind(b.id), color: b.id === 0 ? '#ffffff' : POOL_COLORS[b.id] })),
          score: score ? { wins: score.wins.slice(), best: score.best } : { wins: [0, 0], best: 0 },
          headString: W * POOL.HEAD_STRING,
          ...{ phase: game.phase, turn: game.turn, groups: game.groups.slice(), open: game.open, inHand: game.inHand, behindLine: game.behindLine, shots: game.shots.slice(), winner: game.winner, message, moving: moving() },
        }),
        canShoot: () => game.phase !== 'over' && !moving(),
        // 自由球摆放（返回是否合法；开球时必须放在开球线之后）
        canPlace: canPlaceAt,
        place: (x, y) => {
          // 只有"自由球"或开球时可以挪母球
          if (!game.inHand && game.phase !== 'break') return false
          if (!canPlaceAt(x, y)) return false
          const cb = cue()
          if (!cb) return false
          cb.x = x; cb.y = y; cb.vx = 0; cb.vy = 0; cb.in = false
          dirty = true
          return true
        },
        // 击球：power 0..1（call = 叫的袋口下标，用于 8 号球）
        shoot: (shot) => {
          const s = shot || {}
          if (game.phase === 'over' || moving()) return false
          const cb = cue()
          if (!cb || cb.in) return false
          const power = Math.max(0, Math.min(1, s.power || 0))
          if (power <= 0.01) return false
          game.shots[game.turn] += 1
          facts = { firstHit: null, pocketed: [], cuePocketed: false, railsAfterContact: false, rails: false, contactAt: null }
          const v = Math.min(maxSpeed, power * maxSpeed)
          cb.vx = Math.cos(s.angle || 0) * v
          cb.vy = Math.sin(s.angle || 0) * v
          message = ''
          game.inHand = false
          game.behindLine = false
          dirty = true
          return true
        },
        // 推进：返回 { settled, result }
        step: (dt) => {
          let t = Math.min(Math.max(dt || 0, 0), maxDt)
          while (t > 0) {
            const h = Math.min(substep, t)
            integrate(h)
            collideBalls()
            hitCushions()
            checkPockets()
            t -= h
          }
          dirty = true
          if (facts && !moving()) return { settled: true, result: resolveShot() }
          return { settled: !moving(), result: null }
        },
        // 一杆拉到停稳（关窗口/最小化时用：保证存档永远落在静止态）
        settleNow: () => { if (facts && moving()) { settleSync(); return { settled: true, result: resolveShot() } } return { settled: !moving(), result: null } },
        // 瞄点预测：沿 angle 打出去第一颗撞到的球（id = -1 表示先撞库）
        predict: (angle) => {
          const cb = cue()
          if (!cb) return null
          const dx = Math.cos(angle)
          const dy = Math.sin(angle)
          let best = null
          for (const b of balls) {
            if (b.in || b.id === 0) continue
            const ex = b.x - cb.x
            const ey = b.y - cb.y
            const t = ex * dx + ey * dy
            if (t <= 0) continue
            const perp2 = ex * ex + ey * ey - t * t
            const rr = (2 * R) * (2 * R)
            if (perp2 > rr) continue
            const d = t - Math.sqrt(Math.max(0, rr - perp2))
            if (d < 0) continue
            if (!best || d < best.dist) best = { id: b.id, dist: d, x: cb.x + dx * d, y: cb.y + dy * d }
          }
          const tx = dx > 1e-6 ? (W - R - cb.x) / dx : dx < -1e-6 ? (R - cb.x) / dx : Infinity
          const ty = dy > 1e-6 ? (H - R - cb.y) / dy : dy < -1e-6 ? (R - cb.y) / dy : Infinity
          const wall = Math.max(0, Math.min(tx > 0 ? tx : Infinity, ty > 0 ? ty : Infinity))
          if (!best || wall < best.dist) return { id: -1, dist: wall, x: cb.x + dx * wall, y: cb.y + dy * wall }
          return best
        },
        // 存档：v 是版本号，恢复时不认就直接丢（宁可开新局，也不要把坏数据灌进引擎）
        serialize: () => ({
          v: 1,
          ts: Date.now(),
          finished: game.phase === 'over',
          balls: balls.map((b) => ({ id: b.id, x: b.x, y: b.y, vx: b.vx, vy: b.vy, in: b.in, pocket: b.pocket === undefined ? null : b.pocket })),
          game: {
            phase: game.phase, turn: game.turn, groups: game.groups.slice(), open: game.open,
            inHand: game.inHand, behindLine: game.behindLine,
            shots: game.shots.slice(), winner: game.winner,
          },
          score: { wins: score.wins.slice(), best: score.best },
        }),
        restore: (src) => {
          try {
            const num = (x) => typeof x === 'number' && isFinite(x)
            if (!src || src.v !== 1) return false
            if (!Array.isArray(src.balls) || src.balls.length !== 16) return false
            const seen = {}
            for (const b of src.balls) {
              if (!b || !num(b.id) || !num(b.x) || !num(b.y) || !num(b.vx) || !num(b.vy)) return false
              if (b.id < 0 || b.id > 15 || Math.floor(b.id) !== b.id || seen[b.id]) return false
              seen[b.id] = 1
              if (b.x < -2 || b.x > W + 2 || b.y < -2 || b.y > H + 2) return false
              if (Math.abs(b.vx) > maxSpeed * 4 || Math.abs(b.vy) > maxSpeed * 4) return false
            }
            const s = src.game
            if (!s || ['break', 'open', 'assigned', 'over'].indexOf(s.phase) < 0) return false
            if (s.turn !== 0 && s.turn !== 1) return false
            if (!Array.isArray(s.groups) || s.groups.length !== 2) return false
            if (!Array.isArray(s.shots) || s.shots.length !== 2 || !num(s.shots[0]) || !num(s.shots[1])) return false
            if (s.winner !== null && s.winner !== 0 && s.winner !== 1) return false
            balls = src.balls.map((b) => ({ id: b.id, x: b.x, y: b.y, vx: b.vx, vy: b.vy, in: !!b.in, pocket: num(b.pocket) ? b.pocket : undefined }))
            // 速度归零：存档只应落在静止态（关窗那一刻我们已先算到停稳）
            for (const b of balls) { b.vx = 0; b.vy = 0 }
            game = {
              v: 1, phase: s.phase, turn: s.turn, groups: s.groups.slice(), open: !!s.open,
              inHand: !!s.inHand, behindLine: !!s.behindLine,
              shots: s.shots.slice(), winner: s.winner === null ? null : s.winner,
            }
            score = src.score && Array.isArray(src.score.wins)
              ? { wins: [src.score.wins[0] || 0, src.score.wins[1] || 0], best: src.score.best || 0 }
              : { wins: [0, 0], best: 0 }
            facts = null
            message = ''
            dirty = true
            return true
          } catch (err) { return false }
        },
        // 界面上"脏了就重画"用
        takeDirty: () => { const d = dirty; dirty = false; return d },
        // 取走并清空声音事件（界面每帧取一次；引擎本身不放任何音频代码）
        takeEvents: () => { const e = events; events = []; return e },
      }
    }
    /* GAME-ENGINE:END */

    /* ================================================================== *
     * 电脑对手：选一杆
     *
     * 故意做成**纯函数**（输入引擎，输出 {angle, power, call}）而不是塞进界面里 ——
     * "该打哪颗、会不会先碰到对方的球、会不会把自己打落袋"这些都能在没有界面的情况下断言。
     *
     * 选杆逻辑（不搞搜索树，就是几何 + 打分）：
     *   ① 候选目标：该打 8 号就打 8 号；定了组打自己组；台面开放时**不能先碰 8 号**；
     *   ② 每个「目标球 × 袋口」算假想球位置，要求：切角别太薄、两条线段都不被别的球挡住；
     *   ③ 打分：切角越正、两段距离越短越好；力度按"目标球要跑到袋口 + 母球要先到撞点"反推；
     *   ④ 加上按难度给的瞄准误差（弧度），让它会打丢 —— 不然电脑百发百中没意思；
     *   ⑤ 一个都打不了就轻碰最近的合法目标球，至少别空杆犯规。
     * ================================================================== */
    /* GAME-CPU:BEGIN */
    const POOL_CPU_AIM = { easy: 0.020, normal: 0.010, hard: 0.004 }   // 瞄准误差（弧度）
    const POOL_CPU_LEVELS = ['easy', 'normal', 'hard']
    const poolCpuNextLevel = (lv) => {
      const i = POOL_CPU_LEVELS.indexOf(lv)
      return POOL_CPU_LEVELS[(i < 0 ? 1 : i + 1) % POOL_CPU_LEVELS.length]
    }
    const POOL_CPU_LABELS = { easy: '简单', normal: '普通', hard: '困难' }

    /**
     * 电脑对手选一杆 —— 纯函数：给一个引擎，返回 `{angle, power, call, why}`。
     *
     * 为什么做成纯函数：该打哪颗、会不会先碰到对方的球、会不会把母球也打进袋
     * 这些都能在没有界面的情况下断言（回归测试第 10 节 ⑯）。
     *
     * 两个阶段：
     *   ① **几何筛**：对每个「目标球 × 袋口」算假想球位置，要求切角别太薄、两条线段
     *      都不被别的球挡住；力度按"目标球要跑到袋口 + 母球要先到撞点"反推；
     *      打分 = 切角² / 距离惩罚 × 自杀杆风险降权。
     *   ② **试打验证**（有 `opts.create` 时）：把几何分最高的几杆在**克隆局面**上真跑一遍，
     *      只留"目标球进了、母球没落袋、不犯规"的。 —— 这一步是必须的：
     *      纯几何估算和真物理有偏差，实测出现过"几何上很漂亮、实际打 8 号把自己也打落袋"
     *      的杆法（母球撞后沿切线滑出去正好进另一个袋）。用引擎当真值就不会错。
     */
    const poolCpuShot = (eng, opts) => {
      const o = opts || {}
      const rnd = o.rnd || Math.random
      const err = o.error === undefined
        ? (POOL_CPU_AIM[o.level] === undefined ? POOL_CPU_AIM.normal : POOL_CPU_AIM[o.level])
        : o.error
      const create = o.create || null
      const snap = eng.snapshot()
      const st = eng.state()
      if (st.phase === 'over' || st.moving) return null
      const cue = snap.balls.filter((b) => b.id === 0)[0]
      if (!cue || cue.in) return null
      const R = snap.R
      const decel = o.decel || POOL.DECEL
      const maxSpeed = o.maxSpeed || POOL.MAX_SPEED
      const live = snap.balls.filter((b) => !b.in && b.id !== 0)
      if (!live.length) return null
      // ⚠️ 8 号必须单独一类：写成 `id < 8 ? 'solid' : 'stripe'` 会把 8 号算成花色，
      //    于是"打花色的那家清完自己组"时 needEight 判不出来 → 该打 8 号却去打别的球。
      //    （实心方碰巧看不出来：8 号不会被算进 solid。这个不对称是回归测试抓到的。）
      const grpOf = (id) => (id === 8 ? 'eight' : id < 8 ? 'solid' : 'stripe')
      const mine = st.groups ? st.groups[st.turn] : null
      const mineLeft = mine ? live.filter((b) => grpOf(b.id) === mine) : []
      const needEight = !!mine && mineLeft.length === 0
      const jitter = (a) => a + (rnd() - 0.5) * 2 * err

      // 开球：朝球堆最前那颗满力推（不挑袋，也不用验证）
      if (st.phase === 'break') {
        const first = live.reduce((a, b) => (a.x < b.x ? a : b))
        return {
          angle: Math.atan2(first.y - cue.y, first.x - cue.x) + (rnd() - 0.5) * 0.01,
          power: 0.95, call: null, why: '开球',
        }
      }

      let targets = needEight ? live.filter((b) => b.id === 8)
        : mine ? mineLeft
          : live.filter((b) => b.id !== 8)      // 台面开放：先碰 8 号是犯规
      if (!targets.length) targets = live.filter((b) => b.id !== 8)
      if (!targets.length) targets = live

      // 线段 from→to 上有没有别的球挡着（skip 里的球不算）
      const clearPath = (from, to, skip) => {
        const ex = to.x - from.x
        const ey = to.y - from.y
        const L2 = ex * ex + ey * ey
        if (L2 < 1e-9) return false
        for (const b of live) {
          if (skip.indexOf(b.id) >= 0) continue
          const t = ((b.x - from.x) * ex + (b.y - from.y) * ey) / L2
          if (t <= 0 || t >= 1) continue
          const px = from.x + ex * t
          const py = from.y + ey * t
          if (Math.hypot(b.x - px, b.y - py) < 2 * R - 0.02) return false
        }
        return true
      }

      // ① 几何筛
      const cands = []
      for (const tb of targets) {
        for (let pi = 0; pi < snap.pockets.length; pi++) {
          const pk = snap.pockets[pi]
          const pdx = pk.x - tb.x
          const pdy = pk.y - tb.y
          const dP = Math.hypot(pdx, pdy)
          if (dP < 1e-6) continue
          const ux = pdx / dP
          const uy = pdy / dP
          const ghost = { x: tb.x - ux * 2 * R, y: tb.y - uy * 2 * R }
          if (ghost.x < R || ghost.x > snap.W - R || ghost.y < R || ghost.y > snap.H - R) continue
          const gdx = ghost.x - cue.x
          const gdy = ghost.y - cue.y
          const dG = Math.hypot(gdx, gdy)
          if (dG < 1e-6) continue
          const cut = (gdx / dG) * ux + (gdy / dG) * uy   // cos(切角)：1 = 正着打
          if (cut < 0.22) continue                        // 太薄的不打（打不进还容易犯规）
          if (!clearPath(cue, ghost, [0])) continue
          if (!clearPath(tb, pk, [tb.id])) continue
          // 力度反推：目标球要跑到袋口，母球要先跑到撞点并留下足够的撞击速度
          const v1 = Math.sqrt(2 * decel * dP) * 1.35
          const v0 = Math.sqrt(2 * decel * dG + (v1 / 0.97) * (v1 / 0.97))
          const power = Math.max(0.12, Math.min(1, v0 / maxSpeed))
          // 母球撞后走向（切线速度几乎全留、法向只剩 3%）—— 直奔袋口的降权，
          // 免得"球进了母球也进了"。真正的把关交给下面的试打验证。
          const tx = gdx / dG - cut * ux
          const ty = gdy / dG - cut * uy
          const tlen = Math.hypot(tx, ty)
          const vC = Math.sqrt(Math.max(0, (power * maxSpeed) * (power * maxSpeed) - 2 * decel * dG))
          const vT = vC * tlen
          const vN = vC * cut * 0.03
          const pvx = (tlen > 1e-6 ? tx / tlen : 0) * vT + ux * vN
          const pvy = (tlen > 1e-6 ? ty / tlen : 0) * vT + uy * vN
          const psp = Math.hypot(pvx, pvy)
          const travel = (psp * psp) / (2 * decel)
          let risk = 1
          if (travel > 1 && psp > 1e-6) {
            const sx = pvx / psp
            const sy = pvy / psp
            for (const pk2 of snap.pockets) {
              const ex2 = pk2.x - ghost.x
              const ey2 = pk2.y - ghost.y
              const proj = ex2 * sx + ey2 * sy
              if (proj <= 0 || proj > travel * 1.15) continue
              const perp = Math.abs(ex2 * sy - ey2 * sx)
              if (perp < POOL.POCKET_R + 0.8) risk = Math.min(risk, 0.25)
            }
          }
          cands.push({
            score: ((cut * cut) / (1 + dG / 60 + dP / 60)) * risk,
            angle: jitter(Math.atan2(gdy, gdx)),
            power,
            tb: tb.id,
            why: '打 ' + tb.id + ' 号 → ' + pi + ' 号袋',
          })
        }
      }
      cands.sort((a, b) => b.score - a.score)

      // ② 试打验证：在克隆局面上真跑一遍，按"后果"排序挑最好的那杆。
      //    排序依据（美式八球的判负条件）：
      //      0   进袋 + 不犯规 + 母球没落袋      → 最理想
      //      1   没进但不犯规                    → 只丢一杆
      //      1.5 进了球 + 犯规（普通球）          → 犯规送自由球，但至少进了一颗
      //      2   犯规、母球还在台面              → 送自由球
      //      2.5 母球落袋                        → 送自由球 + 母球重摆
      //      3   **进 8 号同时犯规** = 直接判负   → 最后考虑，能避则避
      const targetIsEight = needEight
      const rankOf = (t) => {
        if (t.potted && !t.cueIn && !t.foul) return 0
        if (t.potted && t.foul) return targetIsEight ? 3 : 1.5
        if (t.foul) return t.cueIn ? 2.5 : 2
        return 1
      }
      let bestTrial = null
      if (create && cands.length) {
        const limit = Math.min(cands.length, o.trials || 6)
        for (let i = 0; i < limit; i++) {
          const c = cands[i]
          let t = null
          try {
            const clone = create({})
            if (!clone.restore(JSON.parse(JSON.stringify(eng.serialize())))) continue
            if (!clone.shoot({ angle: c.angle, power: c.power })) continue
            let res = null
            for (let k = 0; k < 1200 && clone.state().moving; k++) {
              const one = clone.step(1 / 60)
              if (one && one.result) res = one.result
            }
            if (!res) { const rr = clone.settleNow(); res = rr && rr.result }
            const bs = clone.snapshot().balls
            t = {
              potted: !!bs.filter((b) => b.id === c.tb)[0].in,
              cueIn: !!bs.filter((b) => b.id === 0)[0].in,
              foul: !!(res && res.foul),
            }
          } catch (e) { t = null }
          if (!t) continue
          const rk = rankOf(t)
          if (rk === 0) {
            return { angle: c.angle, power: c.power, why: c.why, verified: true }
          }
          if (!bestTrial || rk < bestTrial.rk) bestTrial = { rk, c }
        }
      }
      if (bestTrial && bestTrial.rk <= 2.5) {
        const c = bestTrial.c
        const tag = bestTrial.rk === 1 ? '（保守：打不进也不犯规）'
          : bestTrial.rk === 1.5 ? '（进了但会犯规）'
            : bestTrial.rk === 2 ? '（没办法：这一杆会犯规）'
              : '（没办法：母球会落袋）'
        return { angle: c.angle, power: c.power, why: c.why + tag, verified: true }
      }

      // 几何最优（没验证成：可能不进、也可能犯规 —— 但总比不动强）
      if (cands.length) {
        const c = cands[0]
        return { angle: c.angle, power: c.power, why: c.why, verified: false }
      }

      // 全被挡死：优先找"至少能干净碰到目标球"的方向，否则轻碰最近的那颗。
      // （翻袋是合法打法，但本版不做 —— 这条局限写在 README 里。）
      for (const tb of targets) {
        if (!clearPath(cue, tb, [0])) continue
        return {
          angle: jitter(Math.atan2(tb.y - cue.y, tb.x - cue.x)),
          power: 0.22, why: '没机会：轻碰 ' + tb.id + ' 号',
        }
      }
      const near = targets.reduce((a, b) => (Math.hypot(a.x - cue.x, a.y - cue.y) <= Math.hypot(b.x - cue.x, b.y - cue.y) ? a : b))
      return {
        angle: jitter(Math.atan2(near.y - cue.y, near.x - cue.x)),
        power: 0.22, why: '没机会：轻碰 ' + near.id + ' 号',
      }
    }
    /* GAME-CPU:END */

    /* ================================================================== *
     * 台球音效：全部现场合成（零第三方素材 —— 所以公开版也能带）
     *
     * ⚠️ 不复用提醒功能那套 AudioContext：提醒功能在公开版被**整块剥离**，而这个游戏
     *    两个版本都带 —— 复用会让公开版直接报未定义（和"任务完成提示观察器"同一个坑）。
     *
     * 三种声音，都按撞击强度给音量/音高：
     *   clack  球撞球 —— 短噪声脉冲过带通（2~4.4 kHz）+ 极快衰减
     *   rail   球撞库 —— 低频衰减正弦（约 150 Hz），闷
     *   pot    落袋   —— 两声急促的 clack + 一记低频"咚"
     *   cue    出杆   —— 一记更闷更短的"咚"，提示"打出去了"
     * ================================================================== */
    /* GAME-SFX:BEGIN */
    const poolSfx = { ctx: null, noise: null, on: true, last: 0 }
    const poolAudioCtx = () => {
      if (poolSfx.ctx) return poolSfx.ctx
      const C = globalThis.AudioContext || globalThis.webkitAudioContext
      if (!C) return null
      try {
        poolSfx.ctx = new C()
        if (poolSfx.ctx.state === 'suspended' && poolSfx.ctx.resume) poolSfx.ctx.resume()
      } catch (err) { poolSfx.ctx = null }
      return poolSfx.ctx
    }
    const poolNoiseBuf = (ctx) => {
      if (poolSfx.noise) return poolSfx.noise
      try {
        const len = Math.max(64, Math.floor((ctx.sampleRate || 8000) * 0.06))
        const buf = ctx.createBuffer(1, len, ctx.sampleRate)
        const d = buf.getChannelData(0)
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
        poolSfx.noise = buf
      } catch (err) { poolSfx.noise = null }
      return poolSfx.noise
    }
    /** v = 撞击强度（单位/秒）。返回是否真的发声了（测试要靠它计数）。 */
    const poolClack = (v, tune) => {
      if (!poolSfx.on) return false
      const ctx = poolAudioCtx()
      if (!ctx) return false
      try {
        const vol = Math.max(0.02, Math.min(0.42, v / 130))
        const buf = poolNoiseBuf(ctx)
        if (!buf) return false
        const src = ctx.createBufferSource()
        src.buffer = buf
        const bp = ctx.createBiquadFilter()
        bp.type = 'bandpass'
        bp.frequency.value = (tune || 2000) + Math.min(2400, v * 12)
        bp.Q.value = 1.1
        const g = ctx.createGain()
        const t = ctx.currentTime || 0
        g.gain.setValueAtTime(vol, t)
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
        src.connect(bp)
        bp.connect(g)
        g.connect(ctx.destination)
        src.start(t)
        src.stop(t + 0.06)
        return true
      } catch (err) { return false }
    }
    const poolTone = (freq, vol, dur) => {
      const ctx = poolAudioCtx()
      if (!ctx || typeof ctx.createOscillator !== 'function') return false
      try {
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        const g = ctx.createGain()
        const t = ctx.currentTime || 0
        osc.frequency.setValueAtTime(freq, t)
        osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.55), t + dur)
        g.gain.setValueAtTime(vol, t)
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
        osc.connect(g)
        g.connect(ctx.destination)
        osc.start(t)
        osc.stop(t + dur + 0.02)
        return true
      } catch (err) { return false }
    }
    const poolRail = (v) => (poolSfx.on ? poolTone(140 + Math.min(80, v), Math.max(0.03, Math.min(0.28, v / 160)), 0.09) : false)
    const poolCue = () => (poolSfx.on ? poolTone(190, 0.18, 0.06) : false)
    // ---- 扫雷音效（复用同一套 AudioContext 与合成器；开关跟八球共用"游戏音效"偏好）----
        const mineOpen = () => (poolSfx.on ? poolClack(26, 2600) : false)
    const mineFlag = () => (poolSfx.on ? poolTone(880, 0.07, 0.03) : false)
    const mineBoom = () => {
      if (!poolSfx.on) return false
      poolTone(90, 0.34, 0.34)
      return poolClack(140, 420)
    }
    const mineWin = () => {
      if (!poolSfx.on) return false
      poolTone(660, 0.16, 0.12)
      setTimeout(() => { poolTone(990, 0.16, 0.2) }, 130)
      return true
    }
    const poolPot = () => {
      if (!poolSfx.on) return false
      poolClack(70, 2600)
      setTimeout(() => { poolClack(45, 2100) }, 45)
      return poolTone(120, 0.22, 0.14)
    }
    /* GAME-SFX:END */


    /* ================================================================== *
     * 美式八球：存档读写（localStorage）
     * ================================================================== */
    /* ================================================================== *
     * 扫雷（20×20）引擎 —— 纯逻辑，不碰 DOM
     *
     * 规则按"现代扫雷"（Win7+ 的口径）：
     *   · 第一次点击**一定不是雷**，而且保证点得开（布雷时排除该格与周围 8 格）
     *   · 翻开 0 格自动连锁展开；右键插旗；点已翻开的数字（周围旗数够了）可以"连开"
     *   · 翻开全部非雷格 = 胜（剩余雷自动插旗）；踩雷 = 负（亮出所有雷）
     *
     * 为什么做成纯函数：扫雷最容易错的地方（首点安全、连锁边界、连开判定、胜负条件）
     * 都能在没有界面的情况下断言。局面就是 400 个布尔格 —— "随时暂停"在实现上
     * 就是"局面可序列化"，和八球同一条思路。
     * ================================================================== */
    /* GAME-MINE-ENGINE:BEGIN */
    const MINE = {
      W: 20, H: 20,
      // 雷数（400 格；Windows「高级」是 99/480 ≈ 20.6%，这里取同样密度）
      MINES: { easy: 50, normal: 80, hard: 120 },
      LEVELS: ['easy', 'normal', 'hard'],
      LABELS: { easy: '简单', normal: '普通', hard: '困难' },
      CELL: 22,                 // 单格边长（像素）
    }
    const MINE_SIZE = MINE.W * MINE.H
    const mineNextLevel = (lv) => {
      const i = MINE.LEVELS.indexOf(lv)
      return MINE.LEVELS[(i < 0 ? 1 : i + 1) % MINE.LEVELS.length]
    }
    /** 第 i 格周围合法邻居的下标 */
    const mineNeighbors = (i) => {
      const x = i % MINE.W
      const y = (i - x) / MINE.W
      const out = []
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || ny < 0 || nx >= MINE.W || ny >= MINE.H) continue
          out.push(ny * MINE.W + nx)
        }
      }
      return out
    }
    const createMineEngine = (opts) => {
      const o = opts || {}
      const rnd = o.rnd || Math.random
      const now = o.now || (() => Date.now())
      let level = MINE.MINES[o.level] ? o.level : 'normal'
      let mine = new Array(MINE_SIZE).fill(false)
      let open = new Array(MINE_SIZE).fill(false)
      let flag = new Array(MINE_SIZE).fill(false)
      let count = new Array(MINE_SIZE).fill(0)
      let state = 'ready'          // ready（还没布雷）/ playing / won / lost
      let placed = false
      let openedCount = 0
      let startedAt = null
      let frozen = 0               // 结束时的用时（秒）
      let boom = null              // 踩到的那一格
      const minesOf = () => MINE.MINES[level]
      const elapsed = () => (startedAt === null ? frozen : Math.max(0, Math.floor((now() - startedAt) / 1000)))
      const recount = () => {
        for (let i = 0; i < MINE_SIZE; i++) {
          if (mine[i]) continue
          let c = 0
          for (const j of mineNeighbors(i)) if (mine[j]) c++
          count[i] = c
        }
      }
      const blank = (lv) => {
        level = MINE.MINES[lv] ? lv : level
        mine = new Array(MINE_SIZE).fill(false)
        open = new Array(MINE_SIZE).fill(false)
        flag = new Array(MINE_SIZE).fill(false)
        count = new Array(MINE_SIZE).fill(0)
        state = 'ready'
        placed = false
        openedCount = 0
        startedAt = null
        frozen = 0
        boom = null
      }
      /** 首点安全布雷：排除点中的格子与它周围 8 格 */
      const place = (safeIdx) => {
        const banned = {}
        banned[safeIdx] = true
        for (const j of mineNeighbors(safeIdx)) banned[j] = true
        const pool = []
        for (let i = 0; i < MINE_SIZE; i++) if (!banned[i]) pool.push(i)
        const need = minesOf()
        for (let k = 0; k < need && pool.length; k++) {
          const pick = Math.floor(rnd() * pool.length)
          mine[pool[pick]] = true
          pool[pick] = pool[pool.length - 1]
          pool.pop()
        }
        recount()
        placed = true
        state = 'playing'
        startedAt = now()
      }
      const finish = (s) => {
        state = s
        frozen = elapsed()
        startedAt = null
      }
      const lose = (at) => {
        boom = at
        for (let i = 0; i < MINE_SIZE; i++) if (mine[i]) open[i] = true
        finish('lost')
      }
      const win = () => {
        for (let i = 0; i < MINE_SIZE; i++) if (mine[i]) flag[i] = true
        finish('won')
      }
      const revealFrom = (start) => {
        const stack = [start]
        const seen = {}
        while (stack.length) {
          const i = stack.pop()
          if (seen[i] || open[i] || flag[i]) continue
          seen[i] = true
          open[i] = true
          openedCount++
          if (count[i] === 0) {
            for (const j of mineNeighbors(i)) if (!seen[j] && !open[j] && !flag[j]) stack.push(j)
          }
        }
      }
      const wonYet = () => openedCount >= MINE_SIZE - minesOf()
      const tap = (i) => {
        if (!(i >= 0 && i < MINE_SIZE)) return false
        if (state === 'won' || state === 'lost') return false
        if (open[i] || flag[i]) return false
        if (!placed) place(i)
        if (mine[i]) { lose(i); return true }
        revealFrom(i)
        if (wonYet()) win()
        return true
      }
      const toggleFlag = (i) => {
        if (!(i >= 0 && i < MINE_SIZE)) return false
        if (state === 'won' || state === 'lost') return false
        if (open[i]) return false
        flag[i] = !flag[i]
        return true
      }
      /** 连开：点已翻开的数字，周围旗数正好等于数字 → 翻开周围没插旗的格 */
      const chord = (i) => {
        if (!(i >= 0 && i < MINE_SIZE)) return false
        if (state === 'won' || state === 'lost' || !open[i] || count[i] === 0) return false
        const nb = mineNeighbors(i)
        let f = 0
        for (const j of nb) if (flag[j]) f++
        if (f !== count[i]) return false
        let acted = false
        for (const j of nb) {
          if (open[j] || flag[j]) continue
          if (mine[j]) { lose(j); return true }
          revealFrom(j)
          acted = true
        }
        if (acted && wonYet()) win()
        return acted
      }
      const summary = () => {
        let flags = 0
        for (let i = 0; i < MINE_SIZE; i++) if (flag[i]) flags++
        return {
          level, state, w: MINE.W, h: MINE.H, total: MINE_SIZE,
          mines: minesOf(), flags, opened: openedCount,
          left: MINE_SIZE - minesOf() - openedCount,
          elapsed: elapsed(), boom,
        }
      }
      return {
        W: MINE.W, H: MINE.H,
        reset: (lv) => { blank(lv === undefined ? level : lv); return true },
        tap, flag: toggleFlag, chord,
        state: summary,
        snapshot: () => {
          const st = summary()
          const cells = []
          for (let i = 0; i < MINE_SIZE; i++) {
            cells.push({ i, open: open[i], flag: flag[i], n: count[i], mine: mine[i], boom: boom === i })
          }
          return { ...st, cells }
        },
        /** 只存"有哪些雷/翻开/插旗"，数字与计数在 restore 里重算 —— 存档小且不会自相矛盾 */
        serialize: () => {
          const mi = []
          const op = []
          const fl = []
          for (let i = 0; i < MINE_SIZE; i++) {
            if (mine[i]) mi.push(i)
            if (open[i]) op.push(i)
            if (flag[i]) fl.push(i)
          }
          return { v: 1, level, state, placed, mines: mi, open: op, flag: fl, elapsed: elapsed(), boom }
        },
        restore: (src) => {
          const s2 = src
          if (!s2 || s2.v !== 1) return false
          if (!MINE.MINES[s2.level]) return false
          if (['ready', 'playing', 'won', 'lost'].indexOf(s2.state) < 0) return false
          const arr = (a) => Array.isArray(a) && a.every((n) => Number.isInteger(n) && n >= 0 && n < MINE_SIZE)
          if (!arr(s2.mines) || !arr(s2.open) || !arr(s2.flag)) return false
          const uniq = (a) => new Set(a).size === a.length
          if (!uniq(s2.mines) || !uniq(s2.open) || !uniq(s2.flag)) return false
          if (s2.mines.length < 1 || s2.mines.length > MINE_SIZE - 9) return false
          if (s2.open.length + s2.mines.length > MINE_SIZE) return false
          // 翻开的格子里出现雷，只可能是"踩雷结束"那一局
          const mineSet = new Set(s2.mines)
          if (s2.state !== 'lost' && s2.open.some((i) => mineSet.has(i))) return false
          const el = Number(s2.elapsed)
          if (!(el >= 0 && el < 86400 * 7)) return false
          blank(s2.level)
          for (const i of s2.mines) mine[i] = true
          recount()
          for (const i of s2.open) open[i] = true
          for (const i of s2.flag) flag[i] = true
          openedCount = s2.open.length
          placed = !!s2.placed || s2.mines.length > 0
          state = s2.state
          boom = Number.isInteger(s2.boom) && s2.boom >= 0 && s2.boom < MINE_SIZE ? s2.boom : null
          frozen = el
          // 未结束的局：让计时接着走
          startedAt = state === 'playing' ? now() - el * 1000 : null
          return true
        },
      }
    }
    /* GAME-MINE-ENGINE:END */

    /* GAME-MINE-STORE:BEGIN */
    const MINE_KEY = 'dsh-skin-im2005.mine'
    const MINE_BEST_KEY = 'dsh-skin-im2005.minebest'
    const MINE_LV_KEY = 'dsh-skin-im2005.minelv'
    const MINE_POS_KEY = 'dsh-skin-im2005.minepos'
    const readMineLevel = () => {
      try {
        const v = window.localStorage.getItem(MINE_LV_KEY)
        return MINE.MINES[v] ? v : 'normal'
      } catch (err) { return 'normal' }
    }
    const writeMineLevel = (v) => {
      try { window.localStorage.setItem(MINE_LV_KEY, MINE.MINES[v] ? v : 'normal') } catch (err) {}
    }
    const readMineSave = () => {
      try {
        const raw = window.localStorage.getItem(MINE_KEY)
        return raw ? JSON.parse(raw) : null
      } catch (err) { return null }
    }
    const writeMineSave = (obj) => {
      try { window.localStorage.setItem(MINE_KEY, JSON.stringify(obj)) } catch (err) {}
    }
    const clearMineSave = () => {
      try { window.localStorage.removeItem(MINE_KEY) } catch (err) {}
    }
    /** 各难度最佳用时（秒）；没打过是 null */
    const readMineBest = () => {
      const out = { easy: null, normal: null, hard: null }
      try {
        const j = JSON.parse(window.localStorage.getItem(MINE_BEST_KEY) || '{}')
        for (const lv of MINE.LEVELS) {
          const v = Number(j && j[lv])
          if (v > 0 && v < 86400 * 7) out[lv] = Math.round(v)
        }
      } catch (err) {}
      return out
    }
    const writeMineBest = (b) => {
      try { window.localStorage.setItem(MINE_BEST_KEY, JSON.stringify(b)) } catch (err) {}
    }
    const readMinePos = () => {
      try {
        const o = JSON.parse(window.localStorage.getItem(MINE_POS_KEY) || 'null')
        return o && typeof o.x === 'number' && typeof o.y === 'number' ? { x: o.x, y: o.y } : null
      } catch (err) { return null }
    }
    const writeMinePos = (p) => {
      try { window.localStorage.setItem(MINE_POS_KEY, JSON.stringify({ x: p.x, y: p.y })) } catch (err) {}
    }
    /* GAME-MINE-STORE:END */

    /* FARM-TURN:BEGIN */
    // 任务完成 → 农场 +1 滴水。由任务完成观察器调用（复用同一个信号，不另开观察器）。
    // 节流 5 秒：观察器可能因为 DOM 抖动连触发两次，宁可少算也不能重复计数。
    let farmLastTurnAt = 0
    const farmOnTurn = () => {
      // ⚠️ 守卫必须在节流**之前**：农场还没开过（FARM_ENG 为 null）时也会收到这个信号，
      //    那种"什么也没做"的调用不该吃掉 5 秒窗口 —— 否则真正的那一轮会被误节流。
      //    （这是回归测试抓到的：早期一次空调用把后来的真轮次节流掉了。）
      if (!FARM_ENG) return false
      const t = Date.now()
      if (t - farmLastTurnAt < 5000) return false
      farmLastTurnAt = t
      try {
        FARM_ENG.onTurn()
        writeFarmSave(FARM_ENG.serialize())
        store.set({ farmNote: '上一轮完成 → +1 滴水' })
      } catch (err) { return false }
      return true
    }
    /* FARM-TURN:END */

    /* ================================================================== *
     * 跨会话备注框 —— 一块"所有会话共享"的草稿纸
     *
     * 场景：在 A 会话里做到一半，发现"这事得回 B 会话说"，但不方便现在就切 ——
     * 先记一笔，切过去之后那行字还在。所以它**不是**按会话存的：内容与开关都落
     * 在 localStorage 的全局键上，切会话/重开窗口都还在。
     *
     * 窗口本身沿用游戏那套外壳（拖动 / 双击回默认 / 整窗夹取 / 最小化），
     * 但**没有**存档续局那些东西 —— 它只做一件事：记住你要说的话。
     * ================================================================== */
    /* NOTE-STORE:BEGIN */
    const NOTE_KEY = 'dsh-skin-im2005.note'
    const NOTE_POS_KEY = 'dsh-skin-im2005.notepos'
    const NOTE_OPEN_KEY = 'dsh-skin-im2005.noteopen'
    const readNoteText = () => {
      try { return window.localStorage.getItem(NOTE_KEY) || '' } catch (err) { return '' }
    }
    const writeNoteText = (v) => {
      try { window.localStorage.setItem(NOTE_KEY, String(v == null ? '' : v)) } catch (err) {}
    }
    const readNoteOpen = () => {
      try { return window.localStorage.getItem(NOTE_OPEN_KEY) === '1' } catch (err) { return false }
    }
    const writeNoteOpen = (on) => {
      try { window.localStorage.setItem(NOTE_OPEN_KEY, on ? '1' : '0') } catch (err) {}
    }
    const readNotePos = () => {
      try {
        const o = JSON.parse(window.localStorage.getItem(NOTE_POS_KEY) || 'null')
        return o && typeof o.x === 'number' && typeof o.y === 'number' ? { x: o.x, y: o.y } : null
      } catch (err) { return null }
    }
    const writeNotePos = (p) => {
      try { window.localStorage.setItem(NOTE_POS_KEY, JSON.stringify({ x: p.x, y: p.y })) } catch (err) {}
    }
    /* NOTE-STORE:END */

    /* ================================================================== *
     * Token农场式培养玩法 —— 引擎（纯逻辑，不碰 DOM）
     *
     * 为什么做成纯逻辑：生长/浇水/收获/升级全是"可算的"东西，能在无界面下断言；
     * 而它偏偏又是**靠外部信号驱动**的（余额消耗 + 完成轮次），最怕算错或重复计数。
     *
     * 三个驱动源（用户拍板：接余额 + 轮次；时间作为基线）：
     *   时间   —— 作物按真实时间自然生长（离线也在长，只存 plantedAt，开窗时重算）
     *   轮次   —— 每完成一轮 AI 回复 = +1 滴"水"（离散、可靠）
     *   余额   —— 余额每降 ¥0.10 = +1 滴（真实消耗；零头进 cursor.frac 累积，不丢）
     * 水用来**缩短生长时间**，但单株最多缩到原始时长的 20% —— 时间仍然是有意义的资源。
     *
     * 刻意不做的事：把"充值"换算成"变强"（充值只解锁品种）；不设每日上限（那会惩罚
     * 重度使用），改用**收益递减**防止数值通胀。
     * ================================================================== */
    /* FARM-ENGINE:BEGIN */
    const FARM = {
      COLS: 4, ROWS: 3,          // 最多 12 块地（4×3）
      START_PLOTS: 6,            // 起始 6 块，每升 1 级开 1 块
      LEVEL_XP: 100,             // 每 100 经验升 1 级
      WATER_MIN: 10,             // 第一滴水的价值（分钟）
      WATER_FLOOR: 0.2,          // 浇水最多把总时长缩到 20%
      WATER_DECAY: 6,            // 第 k 滴价值 = 10/(1+k/6)，收益递减
      TURN_WATER: 1,             // 每完成一轮 = 1 滴
      MONEY_STEP: 0.1,           // 余额每降 ¥0.10 = 1 滴
      WATER_CAP: 300,            // 水袋上限
      // ⚠️ 钱一律按**整数分**算：用浮点做 ¥0.25-¥0.20 会得到 0.0499999…，零头累积会漂。
      MONEY_STEP_CENTS: 10,      // ¥0.10 = 10 分 = 1 滴
      CROPS: {
        tomato: { key: 'tomato', name: '番茄', cost: 5, minutes: 20, gold: 10, xp: 10, level: 1, fruit: '#d43b2f', leaf: '#3f8f43' },
        corn: { key: 'corn', name: '玉米', cost: 14, minutes: 45, gold: 26, xp: 22, level: 3, fruit: '#e8c33a', leaf: '#4f9a3f' },
        melon: { key: 'melon', name: '西瓜', cost: 30, minutes: 90, gold: 60, xp: 45, level: 6, fruit: '#2f8f43', leaf: '#356f38' },
      },
      ORDER: ['tomato', 'corn', 'melon'],
    }
    // 生长是**无限**的（用户要求）：视觉形状封顶在 7 档（再往上画只会糊成一团），
    // 但档位本身继续往上走 —— 第 7 档之后用 "×2 / ×3 …" 递增，永远不会"到顶没得玩"。
    // 只增不减：这是养成游戏，倒退会让人很挫败。
    FARM.GROWTH_TIERS = ['刚要发芽', '冒芽', '小苗', '长成株', '枝繁叶茂', '开花', '挂果']
    FARM.TIER_STEP = 2                 // 每 2 点生长 = 1 档
    FARM.MAX_GROWTH = 6                // **只是视觉上限**，不是生长上限
    const farmTierAll = (g) => Math.max(0, Math.floor((Number(g) || 0) / FARM.TIER_STEP))
    /** 视觉档（0..6，封顶） */
    const farmGrowthTier = (g) => Math.min(FARM.MAX_GROWTH, farmTierAll(g))
    /** 无限档位名：第 7 档之后循环名字并加 ×N */
    const farmTierName = (g) => {
      const all = farmTierAll(g)
      const vis = Math.min(FARM.MAX_GROWTH, all)
      const cycle = Math.floor(all / (FARM.MAX_GROWTH + 1))
      return FARM.GROWTH_TIERS[vis] + (cycle > 0 ? ' ×' + (cycle + 1) : '')
    }
    const farmLevel = (xp) => 1 + Math.floor(Math.max(0, xp) / FARM.LEVEL_XP)
    const farmPlots = (level) => Math.min(FARM.COLS * FARM.ROWS, FARM.START_PLOTS + (Math.max(1, level) - 1))
    /** 第 k 滴水的价值（毫秒）：10 分钟起，按 1/(1+k/6) 递减 */
    const farmWaterMs = (k) => {
      let ms = 0
      for (let j = 0; j < k; j++) ms += (FARM.WATER_MIN / (1 + j / FARM.WATER_DECAY)) * 60000
      return ms
    }
    /** 一株作物的有效总时长：原始时长 × (1-最短比例) 为浇水能压缩的极限 */
    const farmPlotTiming = (plot) => {
      const crop = FARM.CROPS[plot.crop]
      if (!crop) return null
      const total = crop.minutes * 60000
      const cap = total * (1 - FARM.WATER_FLOOR)
      const bonus = Math.min(farmWaterMs(plot.water), cap)
      return { total, bonus, ripeAt: plot.plantedAt + Math.max(total * FARM.WATER_FLOOR, total - bonus) }
    }
    const createFarmEngine = (opts) => {
      const o = opts || {}
      // 时间一律由调用方显式传进来（now 是参数，不是内部读时钟）—— 这样生长逻辑可断言
      let st = null
      const blank = () => {
        const n = FARM.START_PLOTS
        const plots = []
        for (let i = 0; i < FARM.COLS * FARM.ROWS; i++) plots.push({ crop: null, plantedAt: 0, water: 0, growth: 0 })
        return {
          plots, unlocked: n, coins: 20, xp: 0, level: 1, water: 3,
          cursor: { balanceCents: null, fracCents: 0 }, seed: 'tomato',
          stat: { turns: 0, harvested: 0, watered: 0, spentYuan: 0 },
        }
      }
      const sync = () => {
        st.level = farmLevel(st.xp)
        st.unlocked = farmPlots(st.level)
        if (st.water > FARM.WATER_CAP) st.water = FARM.WATER_CAP
      }
      const reset = () => { st = blank(); return true }
      reset()
      const stageOf = (plot, t) => {
        const tm = farmPlotTiming(plot)
        if (!tm) return 0
        if (t >= tm.ripeAt) return 4                  // 4 = 成熟
        const p = (t - plot.plantedAt) / Math.max(1, tm.ripeAt - plot.plantedAt)
        if (p < 0.25) return 1                        // 1 = 刚下种
        if (p < 0.6) return 2                         // 2 = 发芽
        return 3                                      // 3 = 长高
      }
      const readyCount = (t) => st.plots.filter((p, i) => i < st.unlocked && p.crop && stageOf(p, t) === 4).length
      return {
        FARM,
        reset,
        state: () => ({ ...st, plots: st.plots.map((p) => ({ ...p })), cursor: { ...st.cursor }, stat: { ...st.stat } }),
        snapshot: (t) => ({
          ...st, cursor: { ...st.cursor }, stat: { ...st.stat },
          plots: st.plots.map((p, i) => {
            const tm = farmPlotTiming(p)
            return {
              i, crop: p.crop, water: p.water, unlocked: i < st.unlocked,
              growth: Math.max(0, Number(p.growth) || 0),
              tier: farmGrowthTier(p.growth),
              tierAll: farmTierAll(p.growth),
              tierName: farmTierName(p.growth),
              stage: p.crop ? stageOf(p, t) : 0,
              ripeAt: tm ? tm.ripeAt : 0,
              progress: tm ? Math.max(0, Math.min(1, (t - p.plantedAt) / Math.max(1, tm.ripeAt - p.plantedAt))) : 0,
              leftMs: tm ? Math.max(0, tm.ripeAt - t) : 0,
            }
          }),
          ready: readyCount(t),
        }),
        /** 种：扣钱、记时间 */
        plant: (i, cropKey, t) => {
          const crop = FARM.CROPS[cropKey]
          if (!crop) return false
          if (!(i >= 0 && i < st.unlocked)) return false
          const p = st.plots[i]
          if (!p || p.crop) return false
          if (st.level < crop.level) return false
          if (st.coins < crop.cost) return false
          st.coins -= crop.cost
          p.crop = cropKey
          p.plantedAt = t
          p.water = 0
          return true
        },
        /** 浇水：花 1 滴水，缩短这株的生长时间 */
        water: (i) => {
          if (!(i >= 0 && i < st.unlocked)) return false
          const p = st.plots[i]
          if (!p || !p.crop) return false
          if (st.water < 1) return false
          const tm = farmPlotTiming(p)
          if (!tm) return false
          if (tm.bonus >= tm.total * (1 - FARM.WATER_FLOOR) - 1) return false    // 已经压到底了
          st.water -= 1
          p.water += 1
          st.stat.watered += 1
          return true
        },
        harvest: (i, t) => {
          if (!(i >= 0 && i < st.unlocked)) return false
          const p = st.plots[i]
          if (!p || !p.crop) return false
          if (stageOf(p, t) !== 4) return false
          const crop = FARM.CROPS[p.crop]
          st.coins += crop.gold
          st.xp += crop.xp
          st.stat.harvested += 1
          p.crop = null
          p.water = 0
          p.plantedAt = 0
          sync()
          return true
        },
        /** 加一滴水（轮次驱动） */
        onTurn: () => {
          st.water = Math.min(FARM.WATER_CAP, st.water + FARM.TURN_WATER)
          st.stat.turns += 1
          return true
        },
        /**
         * 余额消耗 → 水。传入"这次看到的余额"，和上次游标作差：
         * 下降才算消耗；零头进 cursor.frac 累积（¥0.03 + ¥0.03 + ¥0.04 = 1 滴，不会白丢）。
         * 余额上升（充值）**不换算成水** —— 只当作解锁信号（这里只更新游标）。
         */
        creditBalance: (yuan) => {
          const v = Number(yuan)
          if (!(v >= 0) || !Number.isFinite(v)) return { ok: false, reason: 'no-reading' }
          const cents = Math.round(v * 100)
          const prev = st.cursor.balanceCents
          st.cursor.balanceCents = cents
          if (prev === null) return { ok: true, first: true, spent: 0, drops: 0, toppedUp: false }
          const spentCents = prev - cents
          if (spentCents <= 0) {
            return { ok: true, first: false, spent: 0, drops: 0, toppedUp: spentCents < 0 }
          }
          st.cursor.fracCents += spentCents
          const step = FARM.MONEY_STEP_CENTS
          const drops = Math.floor(st.cursor.fracCents / step)
          if (drops > 0) {
            st.cursor.fracCents -= drops * step
            st.water = Math.min(FARM.WATER_CAP, st.water + drops)
            st.stat.spentYuan += spentCents / 100
          }
          return { ok: true, first: false, spent: spentCents / 100, drops, toppedUp: false }
        },
        /** 体力：把"余额游标"重置成当前读到的值（换账号/手动校正时用） */
        syncBalance: (yuan) => {
          const v = Number(yuan)
          if (!(v >= 0) || !Number.isFinite(v)) return false
          st.cursor.balanceCents = Math.round(v * 100)
          return true
        },
        setSeed: (key) => (FARM.CROPS[key] ? (st.seed = key, true) : false),
        /** 换植物：只换品种，**不动已经长出来的部分**（生长永不倒退） */
        setPlant: (key, t) => {
          if (!FARM.CROPS[key]) return false
          const p0 = st.plots[0]
          p0.crop = key
          if (!p0.plantedAt) p0.plantedAt = (t === undefined || t === null) ? Date.now() : t
          st.seed = key
          return true
        },
        /** 加点生长（浇水 / 用量驱动），只增不减 */
        addGrowth: (i, n) => {
          if (!(i >= 0 && i < st.unlocked)) return false
          const p0 = st.plots[i]
          if (!p0 || !p0.crop) return false
          const add = Number(n) || 0
          if (add <= 0) return false
          p0.growth = Math.max(0, Number(p0.growth) || 0) + add
          return true
        },
        /** 时间自然生长：达到"按时间应得的档位"就抬上去，**绝不往下调** */
        tickGrowth: (i, t) => {
          if (!(i >= 0 && i < st.unlocked)) return false
          const p0 = st.plots[i]
          if (!p0 || !p0.crop) return false
          const crop = FARM.CROPS[p0.crop]
          const total = Math.max(1, crop.minutes * 60000)
          // 纯时间也能一直长下去（慢），所以"什么都不做"也不会卡住
          const byTime = p0.plantedAt ? ((t - p0.plantedAt) / total) * FARM.TIER_STEP * 3 : 0
          const want = Math.max(0, byTime)
          if (want > (Number(p0.growth) || 0)) { p0.growth = want; return true }
          return false
        },
        serialize: () => JSON.parse(JSON.stringify({
          v: 1, plots: st.plots, unlocked: st.unlocked, coins: st.coins, xp: st.xp,
          water: st.water, cursor: st.cursor, seed: st.seed, stat: st.stat,
        })),
        restore: (src) => {
          const s2 = src
          if (!s2 || s2.v !== 1) return false
          if (!Array.isArray(s2.plots) || s2.plots.length !== FARM.COLS * FARM.ROWS) return false
          // level / unlocked 是**派生量**（由经验算出来）：只校验存进来的原始量，
          // 派生量在 sync() 里重算 —— 存档不该因为缺一个派生字段就被拒
          const nums = ['coins', 'xp', 'water', 'unlocked']
          for (const k of nums) {
            const v = Number(s2[k])
            if (!Number.isFinite(v) || v < 0 || v > 1e9) return false
          }
          if (!FARM.CROPS[s2.seed]) return false
          for (const p of s2.plots) {
            if (!p || typeof p !== 'object') return false
            if (p.crop !== null && !FARM.CROPS[p.crop]) return false
            const w = Number(p.water)
            const at = Number(p.plantedAt)
            if (!Number.isFinite(w) || w < 0 || w > 9999) return false
            if (!Number.isFinite(at) || at < 0) return false
            if (p.crop === null && (w !== 0 || at !== 0)) return false     // 空地不该带生长数据
            const g2 = Number(p.growth)
            if (p.growth !== undefined && (!Number.isFinite(g2) || g2 < 0 || g2 > 1e6)) return false
            if (p.crop !== null && at <= 0) return false                   // 有作物必须有下种时间
          }
          st = blank()
          st.plots = s2.plots.map((p) => ({ crop: p.crop, plantedAt: Number(p.plantedAt), water: Number(p.water), growth: Math.max(0, Number(p.growth) || 0) }))
          st.coins = Number(s2.coins)
          st.xp = Number(s2.xp)
          st.water = Math.min(FARM.WATER_CAP, Number(s2.water))
          const cur = s2.cursor || {}
          const cents = cur.balanceCents
          st.cursor = {
            balanceCents: cents === null || cents === undefined ? null : (Number.isFinite(Number(cents)) && Number(cents) >= 0 ? Math.floor(Number(cents)) : null),
            fracCents: Number.isFinite(Number(cur.fracCents)) && Number(cur.fracCents) > 0
              ? Math.min(FARM.MONEY_STEP_CENTS - 1, Math.floor(Number(cur.fracCents)))
              : 0,
          }
          st.seed = s2.seed
          const s3 = s2.stat || {}
          st.stat = {
            turns: Math.max(0, Math.floor(Number(s3.turns) || 0)),
            harvested: Math.max(0, Math.floor(Number(s3.harvested) || 0)),
            watered: Math.max(0, Math.floor(Number(s3.watered) || 0)),
            spentYuan: Math.max(0, Number(s3.spentYuan) || 0),
          }
          sync()
          return true
        },
      }
    }
    /* FARM-ENGINE:END */

    /* FARM-STORE:BEGIN */
    const FARM_KEY = 'dsh-skin-im2005.farm'
    const FARM_POS_KEY = 'dsh-skin-im2005.farmpos'
    const FARM_OPEN_KEY = 'dsh-skin-im2005.farmopen'
    const readFarmSave = () => {
      try {
        const raw = window.localStorage.getItem(FARM_KEY)
        return raw ? JSON.parse(raw) : null
      } catch (err) { return null }
    }
    const writeFarmSave = (o) => {
      try { window.localStorage.setItem(FARM_KEY, JSON.stringify(o)) } catch (err) {}
    }
    const readFarmOpen = () => {
      try { return window.localStorage.getItem(FARM_OPEN_KEY) === '1' } catch (err) { return false }
    }
    const writeFarmOpen = (on) => {
      try { window.localStorage.setItem(FARM_OPEN_KEY, on ? '1' : '0') } catch (err) {}
    }
    const readFarmPos = () => {
      try {
        const o = JSON.parse(window.localStorage.getItem(FARM_POS_KEY) || 'null')
        return o && typeof o.x === 'number' && typeof o.y === 'number' ? { x: o.x, y: o.y } : null
      } catch (err) { return null }
    }
    const writeFarmPos = (p) => {
      try { window.localStorage.setItem(FARM_POS_KEY, JSON.stringify({ x: p.x, y: p.y })) } catch (err) {}
    }
    // 农场音效：**默认关**（用户要求），且独立于其它小游戏的那份开关
    const FARM_SFX_KEY = 'dsh-skin-im2005.farmsfx'
    const readFarmSfx = () => {
      try { return window.localStorage.getItem(FARM_SFX_KEY) === '1' } catch (err) { return false }
    }
    const writeFarmSfx = (on) => {
      try { window.localStorage.setItem(FARM_SFX_KEY, on ? '1' : '0') } catch (err) {}
    }
    /* FARM-STORE:END */

    /* GAME-STORE:BEGIN */
    const POOL_SAVE_KEY = 'dsh-skin-im2005.pool'
    const POOL_POS_KEY = 'dsh-skin-im2005.poolpos'
    /** 读存档。坏数据一律当"没有存档"（宁可开新局，也不要把脏数据灌进引擎）。 */
    const readPoolSave = () => {
      try {
        const raw = window.localStorage.getItem(POOL_SAVE_KEY)
        if (!raw) return null
        const obj = JSON.parse(raw)
        return obj && typeof obj === 'object' ? obj : null
      } catch (err) { return null }
    }
    const writePoolSave = (obj) => {
      try { window.localStorage.setItem(POOL_SAVE_KEY, JSON.stringify(obj)); return true } catch (err) { return false }
    }
    const clearPoolSave = () => {
      try { window.localStorage.removeItem(POOL_SAVE_KEY) } catch (err) {}
    }
    const readPoolPos = () => {
      try {
        const obj = JSON.parse(window.localStorage.getItem(POOL_POS_KEY) || 'null')
        if (obj && typeof obj.x === 'number' && typeof obj.y === 'number' && isFinite(obj.x) && isFinite(obj.y)) return obj
      } catch (err) {}
      return null
    }
    // 对手（电脑/双人）与电脑难度：存偏好，默认**跟电脑打**
    const POOL_VS_KEY = 'dsh-skin-im2005.poolvs'
    const readPoolVs = () => {
      try { return window.localStorage.getItem(POOL_VS_KEY) === 'human' ? 'human' : 'cpu' } catch (err) { return 'cpu' }
    }
    const writePoolVs = (v) => { try { window.localStorage.setItem(POOL_VS_KEY, v === 'human' ? 'human' : 'cpu') } catch (err) {} }
    const POOL_LV_KEY = 'dsh-skin-im2005.poollv'
    const readPoolLevel = () => {
      try {
        const v = window.localStorage.getItem(POOL_LV_KEY)
        return ['easy', 'normal', 'hard'].indexOf(v) >= 0 ? v : 'normal'
      } catch (err) { return 'normal' }
    }
    const writePoolLevel = (v) => { try { window.localStorage.setItem(POOL_LV_KEY, v) } catch (err) {} }
    // 音效开关（默认开）
    const POOL_SFX_KEY = 'dsh-skin-im2005.poolsfx'
    const readPoolSfx = () => {
      try { return window.localStorage.getItem(POOL_SFX_KEY) !== '0' } catch (err) { return true }
    }
    const writePoolSfx = (on) => { try { window.localStorage.setItem(POOL_SFX_KEY, on ? '1' : '0') } catch (err) {} }
    const writePoolPos = (pos) => {
      try { window.localStorage.setItem(POOL_POS_KEY, JSON.stringify({ x: pos.x, y: pos.y })) } catch (err) {}
    }
    // 球桌窗口大小（缩放系数 k）。坏值一律退回 1，不让存档把界面搞坏。
    const POOL_SIZE_KEY = 'dsh-skin-im2005.poolsize'
    const readPoolSize = () => {
      try {
        const v = Number(window.localStorage.getItem(POOL_SIZE_KEY))
        return v > 0 ? POOL_VIEW.clampK(v) : 1
      } catch (err) { return 1 }
    }
    const writePoolSize = (k) => {
      try { window.localStorage.setItem(POOL_SIZE_KEY, String(POOL_VIEW.clampK(k))) } catch (err) {}
    }
    /* GAME-STORE:END */


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
      // 聊天抬头的绿名 = 我的昵称（默认「我」，可在 个人空间 面板里改）。**与账号名无关**
      nickname: readNickname(),
      setNickname: null,
      
      
      /* GAME-UI-STORE:BEGIN */
      // 美式八球：窗口开关 / 按钮 tooltip 上的存档说明 / 任务完成提示 / 对手 / 难度 / 音效
      poolOpen: false,
      poolNote: '',
      poolHint: '',
      poolVs: 'cpu',
      poolCpu: 'normal',
      poolSfx: true,
      // 扫雷（20×20）：窗口开关 / 难度 / 提示沿用同一个 poolHint（同一时刻通常只开一个游戏窗）
      mineOpen: false,
      mineLevel: 'normal',
      // 跨会话备注框：开关落在 localStorage 全局键上（切会话/重开都还在）
      noteOpen: false,
      // Token农场
      farmOpen: false,
      farmNote: '',
      farmSfx: false,
      /* GAME-UI-STORE:END */
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
    const ImTitleBar = () => {
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

    const ImToolBar = () => {
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
        btn('pin', '形象秀',
          s.pinned ? '形象秀 面板已固定（点击取消，面板可以收起）' : '点击固定 形象秀 面板',
          () => { try { if (s.togglePin) s.togglePin() } catch (err) {} }, s.pinned),
        
        /* GAME-BUTTON:BEGIN */
        // 跨会话备注框：所有会话共用一块草稿纸。用户要求它排在「提醒按钮」和美式八球之间
        // —— 三个游戏/工具里它最"日常"，放前面。（措辞避开提醒功能的关键词：
        //   公开版会把提醒整块剥掉，残留检查是逐字匹配的）
        btn('note', '跨会话备注框',
          '跨会话备注框：在这儿写"切到别的会话要做什么"。内容存在本机全局，切换会话、重开窗口都还在。',
          () => {
            try {
              const on = !s.noteOpen
              store.set({ noteOpen: on })
              if (typeof writeNoteOpen === 'function') writeNoteOpen(on)
            } catch (err) {}
          }),
        // 美式八球：等 AI 回复的时候打发时间。开关只切 store.poolOpen，
        // 局面与存档在窗口自己那边（模块级引擎 + localStorage），关掉不丢。
        btn('pool', '美式八球',
          '美式八球：默认跟电脑打，可切双人；每杆停稳自动存档，关掉再开可接着打'
          + (s.poolNote ? '\n' + s.poolNote : ''),
          () => { try { store.set({ poolOpen: !s.poolOpen, poolHint: '' }) } catch (err) {} }),
        // 扫雷：同样只切开关，局面在窗口那边（模块级引擎 + localStorage）
        btn('mine', '扫雷',
          '扫雷 20×20：左键翻开 · 右键插旗 · 双击数字连开；每步自动存档，关掉再开接着扫',
          () => { try { store.set({ mineOpen: !s.mineOpen, poolHint: '' }) } catch (err) {} }),
        // Token农场：时间 + 轮次 + 余额消耗三个驱动
        btn('farm', 'Token农场',
          'Token农场：种下 → 生长 → 收获。每完成一轮 AI 回复 +1 滴水，余额每降 ¥0.10 +1 滴；每步自动存档。',
          () => {
            try {
              const on = !s.farmOpen
              store.set({ farmOpen: on, farmNote: '' })
              writeFarmOpen(on)
            } catch (err) {}
          }),
        /* GAME-BUTTON:END */
      )
    }

    /* ================================================================== *
     * 2b. Balance dialog -> shell.overlay (list slot)
     * ================================================================== */
    const ImBalanceDialog = () => {
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
    const ImSkinControl = () => {
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
        // 绿名以 CSS 变量注入，供消息抬头行的 ::before（content: var(...)）使用：
        //   · CSS 不能自己拿到 JS 数据，但 content 支持 var()，所以这条路走得通；
        //   · 名字里的 " 和 \ 必须转义，否则整条规则会坏掉。
        //
        // 这里注入的是**我的昵称**（默认「我」，可在 个人空间 里改），**不是账号名**：
        // IM2005 的聊天抬头是"我的昵称"，账号名（getProfile.name）通常是登录身份，
        // 挂在这里会很怪 —— 用户明确反馈过"绿名恒为账户用户名，不是我"。
        h('style', {
          key: 'chrome',
          children: s.variant === 0 ? '' : CHROME_CSS + (
            ':root{--dsh-im-username:"' +
            String(s.nickname || DEFAULT_NICK).replace(/[\\"]/g, '\\$&') + '"}'
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
    const ImStripChrome = () => {
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
    const ImHeaderActions = () => {
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

    const ImProfileCard = () => {
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
    const ImBrandMark = () => h('span', {
      className: 'dsh-skin-im2005-brandmark',
      title: 'IM2005 皮肤',
      style: { display: 'inline-flex', alignItems: 'center', padding: '0 2px' },
    }, h(Penguin, { size: 16 }))

    /* ================================================================== *
     * 5. Sidebar footer -> sidebar.footer.action  (status + live clock)
     * ================================================================== */
    const ImFooterStatus = () => {
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
    const ImSection = ({ title, open, onToggle, children, style, bodyStyle }) => h('div', {
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

    /* GAME-VIEW:BEGIN */
    // ==================================================================
    // 美式八球浮窗：canvas 渲染 + 拉杆出杆 + 自由球摆放 + 音效
    //
    // 三个刻意的结构选择（都是为了不把宿主界面拖慢、不把局面搞丢）：
    //  ① **引擎实例放模块级**（POOL_ENG）：开窗/关窗/最小化都只是 React 挂载卸载，
    //     局面不能跟着 state 一起没。窗口一关就丢进度是这个功能的致命伤。
    //  ② **60 Hz 只画 canvas，不进 React**：HUD 只在"杆结束 / 换人 / 存档"这些事件上
    //     setState。每帧 setState 会把整个宿主界面拖着重渲染。
    //  ③ **鼠标坐标 → 台面坐标走固定比例**（不做响应式缩放）：台面尺寸写死，
    //     坐标换算就成了常量乘法，测试里也不用模拟布局。
    //
    // 画面按用户给的参考图逐像素采样出来的配色画（见 docs/pool-game-plan.md 第 7 节）：
    // 台面径向渐变绿、暗红木库边 + 受光条、纯黑袋口、塑料球高光 + 白圈数字。
    // ==================================================================
    const POOL_VIEW = { w: 600, rail: 14 }
    POOL_VIEW.scale = (POOL_VIEW.w - 2 * POOL_VIEW.rail) / POOL.W
    POOL_VIEW.h = Math.round(2 * POOL_VIEW.rail + POOL.H * POOL_VIEW.scale)
    // 窗口外框尺寸（位置夹取与回归测试都要用 —— 别再在组件里散落魔法数字）
    POOL_VIEW.titleH = 30                                        // 最小化后只剩标题栏
    POOL_VIEW.winW = POOL_VIEW.w + 2                             // 左右各 1px 边框
    POOL_VIEW.winH = 24 + POOL_VIEW.h + 44 + POOL_VIEW.titleH     // HUD 24 + 画布 + 提示 44 + 标题栏
    // 可缩放范围：窗口大小 = 这份基准 × k（球台比例恒定，不做自由拉伸）
    POOL_VIEW.minK = 0.6
    POOL_VIEW.maxK = 1.5
    POOL_VIEW.clampK = (k) => Math.max(POOL_VIEW.minK, Math.min(POOL_VIEW.maxK, Number(k) || 1))
    // 力度换算：鼠标往后拉多少**台面单位**算满力。数值越小越灵敏。
    // 原来是 34（约台长的 1/3），用户嫌太钝 → 提到 22（约台长的 22%）。
    // 回归测试钉住一条：满力拉动距离不得超过台长的 1/4（= 25），否则算灵敏度退化。
    POOL_VIEW.pullFull = 22
    // 层级：IM 秀那几个浮层用的是 Z = 2147483000（皮肤里的"最高层"），球桌原来写死 40 → 永远被压住。
    // 用户要求球桌压在 IM 栏目之上，所以取 Z + 2（仍在 z-index 合法范围 2147483647 内）。
    // 代价：球桌也会盖住宿主的普通浮层 —— 最小化成一条标题栏就能让开。
    POOL_VIEW.skinZ = Z
    POOL_VIEW.z = Z + 2
    let POOL_ENG = null            // 模块级会话：窗口关掉再开，局面还在
    let POOL_RAF = 0
    let POOL_COMBO = null          // { text, until } 一杆多进的弹字

    /** 调色：k > 0 提亮，k < 0 压暗（用来做球体的径向渐变） */
    const poolShade = (hex, k) => {
      const n = parseInt(String(hex).slice(1), 16)
      const f = (v) => Math.max(0, Math.min(255, Math.round(v + 255 * k)))
      return '#' + [f((n >> 16) & 255), f((n >> 8) & 255), f(n & 255)]
        .map((v) => v.toString(16).padStart(2, '0')).join('')
    }

    /** 画一张球桌。view: { w, h, scale, aim:{angle,power}, placeAt } */
    const drawPool = (g, eng, view) => {
      const snap = eng.snapshot()
      const sc = view.scale
      const rail = POOL_VIEW.rail
      const px = (x) => rail + x * sc
      const py = (y) => rail + y * sc
      const rr = snap.R * sc

      // 库边：外框暗红木（采样 #420d06）
      g.fillStyle = '#420d06'
      g.fillRect(0, 0, view.w, view.h)
      // 内沿受光条（采样 #8a6538）
      g.fillStyle = '#8a6538'
      g.fillRect(rail - 4, rail - 4, view.w - 2 * (rail - 4), view.h - 2 * (rail - 4))
      // 台面：径向渐变（中心 #429140 → 边缘 #2a6024）
      const rg = g.createRadialGradient(view.w / 2, view.h / 2, 12, view.w / 2, view.h / 2, view.w * 0.62)
      rg.addColorStop(0, '#429140')
      rg.addColorStop(0.55, '#33742d')
      rg.addColorStop(1, '#2a6024')
      g.fillStyle = rg
      g.fillRect(rail - 2, rail - 2, view.w - 2 * (rail - 2), view.h - 2 * (rail - 2))
      // 库边与台面之间一条亮线
      g.strokeStyle = 'rgba(255,255,255,0.16)'
      g.lineWidth = 1
      g.strokeRect(rail - 2.5, rail - 2.5, view.w - 2 * (rail - 2.5), view.h - 2 * (rail - 2.5))

      // 开球线（参考图里几乎看不见，画一条极淡的）
      g.strokeStyle = 'rgba(255,255,255,0.13)'
      g.beginPath()
      g.moveTo(px(snap.headString), py(0))
      g.lineTo(px(snap.headString), py(snap.H))
      g.stroke()

      // 6 个袋口：纯黑圆 + 一点外阴影（半径按引擎的吃球半径画，别写死 —— 改比例时会漏改）
      for (const p of snap.pockets) {
        g.beginPath()
        g.arc(px(p.x), py(p.y), snap.pocketR * sc, 0, Math.PI * 2)
        g.fillStyle = '#010101'
        g.fill()
      }

      // 球
      for (const b of snap.balls) {
        if (b.in) continue
        const cx = px(b.x)
        const cy = py(b.y)
        if (b.kind === 'cue') {
          const cg = g.createRadialGradient(cx - rr * 0.35, cy - rr * 0.35, rr * 0.1, cx, cy, rr)
          cg.addColorStop(0, '#ffffff')
          cg.addColorStop(0.6, '#efe9df')
          cg.addColorStop(1, '#b9b1a4')
          g.beginPath(); g.arc(cx, cy, rr, 0, Math.PI * 2); g.fillStyle = cg; g.fill()
          continue
        }
        if (b.kind === 'stripe') {
          // 花色球：白底 + 中间一道彩带
          const wg = g.createRadialGradient(cx - rr * 0.35, cy - rr * 0.35, rr * 0.1, cx, cy, rr)
          wg.addColorStop(0, '#ffffff')
          wg.addColorStop(1, '#cfc9be')
          g.beginPath(); g.arc(cx, cy, rr, 0, Math.PI * 2); g.fillStyle = wg; g.fill()
          g.save()
          g.beginPath(); g.arc(cx, cy, rr, 0, Math.PI * 2); g.clip()
          g.fillStyle = b.color
          g.fillRect(cx - rr, cy - rr * 0.62, rr * 2, rr * 1.24)
          g.restore()
        } else {
          const bg = g.createRadialGradient(cx - rr * 0.35, cy - rr * 0.35, rr * 0.1, cx, cy, rr)
          bg.addColorStop(0, poolShade(b.color, 0.22))
          bg.addColorStop(0.55, b.color)
          bg.addColorStop(1, poolShade(b.color, -0.14))
          g.beginPath(); g.arc(cx, cy, rr, 0, Math.PI * 2); g.fillStyle = bg; g.fill()
        }
        // 白圈数字
        g.beginPath(); g.arc(cx, cy, rr * 0.5, 0, Math.PI * 2); g.fillStyle = '#f7f5ef'; g.fill()
        g.fillStyle = '#141414'
        g.font = 'bold ' + Math.max(7, Math.round(rr * 0.72)) + 'px SimSun, serif'
        g.textAlign = 'center'
        g.textBaseline = 'middle'
        g.fillText(String(b.id), cx, cy + 0.5)
      }

      // 自由球预览
      if (view.placeAt) {
        g.beginPath()
        g.arc(px(view.placeAt.x), py(view.placeAt.y), rr, 0, Math.PI * 2)
        g.fillStyle = 'rgba(255,255,255,' + (view.placeOk ? 0.7 : 0.25) + ')'
        g.fill()
        g.strokeStyle = view.placeOk ? '#1de06a' : '#e0503a'
        g.lineWidth = 2
        g.stroke()
      }

      // 瞄准线 + 球杆（只有轮到自己、球都停了才画）
      if (view.aim) {
        const cue = snap.balls.filter((b) => b.id === 0)[0]
        if (cue && !cue.in) {
          const a = view.aim.angle
          const pr = eng.predict(a)
          g.setLineDash([6, 5])
          g.strokeStyle = 'rgba(255,255,255,0.62)'
          g.lineWidth = 1.5
          g.beginPath()
          g.moveTo(px(cue.x), py(cue.y))
          g.lineTo(px(pr.x), py(pr.y))
          g.stroke()
          g.setLineDash([])
          if (pr.id >= 0) {
            g.beginPath()
            g.arc(px(pr.x), py(pr.y), rr * 0.9, 0, Math.PI * 2)
            g.strokeStyle = 'rgba(255,255,255,0.5)'
            g.lineWidth = 1.5
            g.stroke()
          }
          // 球杆：沿瞄准线反向拉开，力度越大拉得越远
          const back = 3 + view.aim.power * 26
          const len = 58
          const x0 = cue.x - Math.cos(a) * (snap.R + back)
          const y0 = cue.y - Math.sin(a) * (snap.R + back)
          g.strokeStyle = '#d8b071'
          g.lineWidth = Math.max(2.4, rr * 0.34)
          g.lineCap = 'round'
          g.beginPath()
          g.moveTo(px(x0), py(y0))
          g.lineTo(px(x0 - Math.cos(a) * len), py(y0 - Math.sin(a) * len))
          g.stroke()
          g.strokeStyle = '#4a3520'
          g.lineWidth = Math.max(2.4, rr * 0.36)
          g.beginPath()
          g.moveTo(px(x0), py(y0))
          g.lineTo(px(x0 - Math.cos(a) * 3), py(y0 - Math.sin(a) * 3))
          g.stroke()
          // 力度条（左下角）
          const bw = 90
          const bh = 9
          const bx = rail + 6
          const by = view.h - rail - bh - 6
          g.fillStyle = 'rgba(0,0,0,0.35)'
          g.fillRect(bx, by, bw, bh)
          g.fillStyle = view.aim.power > 0.8 ? '#ff5a3c' : view.aim.power > 0.5 ? '#ffc733' : '#4ce07a'
          g.fillRect(bx, by, Math.max(1, bw * view.aim.power), bh)
          g.strokeStyle = 'rgba(255,255,255,0.5)'
          g.lineWidth = 1
          g.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1)
        }
      }

      // 一杆多进的弹字（参考图中央那个「N 连环 COMBO」）
      if (POOL_COMBO && Date.now() < POOL_COMBO.until) {
        g.font = 'bold 30px SimSun, serif'
        g.textAlign = 'center'
        g.textBaseline = 'middle'
        g.lineWidth = 5
        g.strokeStyle = '#141414'
        g.strokeText(POOL_COMBO.text, view.w / 2, view.h / 2)
        g.fillStyle = '#ffe14d'
        g.fillText(POOL_COMBO.text, view.w / 2, view.h / 2 + 22)
      }
    }

    const ImPoolWindow = (props) => {
      const s = useStore()
      // 槽的 inject 会把这些传进来；万一没有（宿主行为变化），就用模块级实现兜底 ——
      // 引擎/存档/位置本来就是模块内的东西，不依赖外部注入也能自洽。
      const save = props.save || { read: readPoolSave, write: writePoolSave, clear: clearPoolSave }
      const posStore = props.pos || { read: readPoolPos, write: writePoolPos }
      const makeEngine = (props.engine && props.engine.create) || createPoolEngine
      const boot = React.useRef(null)
      const canvasRef = React.useRef(null)
      const drag = React.useRef(null)
      const aim = React.useRef({ angle: 0, power: 0 })
      const placeAt = React.useRef(null)
      const mounted = React.useRef(true)

      // 懒初始化：复用本次会话已有的引擎；没有就新建，并尝试恢复上一局
      if (!boot.current) {
        const sv = save.read()
        let eng = POOL_ENG
        let resumed = false
        if (eng) {
          resumed = !!(sv && !sv.finished)
        } else {
          eng = makeEngine({})
          if (sv && !sv.finished) resumed = eng.restore(sv)
          else eng.reset()
          POOL_ENG = eng
        }
        boot.current = { eng, resumed }
      }
      const eng = boot.current.eng

      const hudOf = () => {
        const st = eng.state()
        const sc = eng.snapshot().score
        return {
          turn: st.turn, shots: st.shots, groups: st.groups, open: st.open, inHand: st.inHand,
          phase: st.phase, message: st.message, winner: st.winner, moving: st.moving,
          wins: sc.wins, best: sc.best,
        }
      }
      const [hud, setHud] = React.useState(hudOf)
      const [askResume, setAskResume] = React.useState(boot.current.resumed)
      const [min, setMin] = React.useState(false)
      const [over, setOver] = React.useState(null)
      const sizeStore = props.size || { read: readPoolSize, write: writePoolSize }
      const [k, setK] = React.useState(() => sizeStore.read())
      // 一处算清"这一帧的尺寸"：画布、坐标换算、位置夹取全用它 ——
      // 三者用不同来源就会出现"改完大小瞄不准"这类幽灵 bug。
      // ko = 显式指定缩放系数（拖拽缩放时用：那一刻 React 还没重渲染，闭包里的 k 是旧值）
      const metrics = (ko) => {
        const kk = ko === undefined ? k : ko
        const rail = POOL_VIEW.rail
        const sc = POOL_VIEW.scale * kk
        const w = Math.round(2 * rail + POOL.W * sc)
        const h = Math.round(2 * rail + POOL.H * sc)
        // ⚠️ 窗口外面那三条（标题栏 / HUD / 提示行）**必须跟着 k 一起缩**：
        //    它们原来是写死高度的，把小窗拖小之后三条还是原尺寸 —— 又粗、又挡住底下的界面，
        //    而且 HUD 的内容相对更宽会被裁掉（用户实测"上面那些条条很突兀"）。
        //    字号给了下限 9px，缩到最小也还认得出。
        const titleH = Math.max(24, Math.round(30 * kk))
        const hudH = Math.max(18, Math.round(24 * kk))
        const tipH = Math.max(34, Math.round(44 * kk))
        const fs = Math.max(9, Math.round(11 * kk))
        const winW = w + 2
        const winH = min ? titleH : (hudH + h + tipH + titleH)
        return { rail, sc, w, h, titleH, hudH, tipH, fs, winW, winH }
      }
      const winW = metrics().winW
      const winH = metrics().winH
      // ⚠️ 硬夹取：**整窗**必须留在应用窗口的视口里。
      //    浮层是渲染层 DOM，天生被应用窗口裁掉 —— 拖出去既看不见也抓不回来（用户实测）。
      //    插件建不了独立窗口（主进程没给这个口子），所以只能保证"永远拖不丢"。
      const clampPos = (x, y, hgt) => {
        const vw = globalThis.innerWidth || 1200
        const vh = globalThis.innerHeight || 800
        const H = hgt || metrics().winH
        const W = metrics().winW
        return {
          x: Math.max(0, Math.min(Math.max(0, vw - W), x)),
          y: Math.max(0, Math.min(Math.max(0, vh - H), y)),
        }
      }
      const defaultPos = () => clampPos(
        (globalThis.innerWidth || 1200) - winW - 40,
        (globalThis.innerHeight || 800) - winH - 90,
      )
      const [pos, setPos] = React.useState(() => clampPos(
        (posStore.read() || defaultPos()).x,
        (posStore.read() || defaultPos()).y,
      ))
      React.useEffect(() => () => { mounted.current = false }, [])
      // 注意：这里**不用 effect 初始化画布** —— 画布尺寸与 dpr 缩放放在 paint() 里惰性做。
      // 原因：effect 只在挂载后跑一次，而 paint() 可能先被鼠标事件调用；惰性做两边都稳。

      const paint = (ko) => {
        const cv = canvasRef.current
        if (!cv || typeof cv.getContext !== 'function') return
        const m = metrics(ko)
        // 尺寸变了（用户拖大了窗口）才重设 width/height，并且要重新 scale(dpr)
        // —— canvas 的 width 赋值会清空画布、也会重置变换矩阵，所以放这里同步做。
        if (cv.__poolW !== m.w || cv.__poolH !== m.h) {
          const dpr = globalThis.devicePixelRatio || 1
          cv.width = m.w * dpr
          cv.height = m.h * dpr
          const g0 = cv.getContext('2d')
          if (g0 && typeof g0.setTransform === 'function') {
            g0.setTransform(1, 0, 0, 1, 0, 0)
            g0.scale(dpr, dpr)
          } else if (g0 && typeof g0.scale === 'function') {
            g0.scale(dpr, dpr)
          }
          cv.__poolW = m.w
          cv.__poolH = m.h
          cv.__poolSized = true
        }
        const g = cv.getContext('2d')
        if (!g) return
        drawPool(g, eng, {
          w: m.w, h: m.h, scale: m.sc,
          aim: eng.canShoot() ? aim.current : null,
          placeAt: placeAt.current, placeOk: placeAt.current ? eng.canPlace(placeAt.current.x, placeAt.current.y) : false,
        })
      }
      const saveNow = (note) => {
        try {
          const r = eng.settleNow()
          if (r && r.result) { setHud(hudOf()); if (r.result.kind === 'over') setOver({ winner: eng.state().winner }) }
          save.write(eng.serialize())
          store.set({ poolNote: note || '存档：' + stampNote() })
        } catch (err) { /* 存不上不能影响玩 */ }
      }
      const stampNote = () => {
        const st = eng.state()
        const left = eng.snapshot().balls.filter((b) => !b.in && b.id !== 0).length
        const hh = new Date()
        const t = ('0' + hh.getHours()).slice(-2) + ':' + ('0' + hh.getMinutes()).slice(-2)
        return (st.phase === 'over' ? '上一局已结束' : '第 ' + (st.shots[0] + st.shots[1] + 1) + ' 杆 · 还剩 ' + left + ' 颗球') + ' · ' + t + ' 自动保存'
      }
      const onSettled = (result) => {
        setHud(hudOf())
        if (result) {
          if (result.pocketed && result.pocketed.length >= 2) {
            POOL_COMBO = { text: result.pocketed.length + ' 连环 COMBO', until: Date.now() + 900 }
            setTimeout(() => { if (mounted.current) paint() }, 950)
          }
          if (result.kind === 'over') setOver({ winner: eng.state().winner })
        }
        saveNow()
      }
      const startLoop = () => {
        if (POOL_RAF) return
        let last = null
        const tick = (ts) => {
          POOL_RAF = 0
          const dt = last === null ? 0 : Math.min((ts - last) / 1000, 0.1)
          last = ts
          const r = eng.step(dt)
          playEvents()
          paint()
          if (r.result) onSettled(r.result)
          if (eng.state().moving) POOL_RAF = requestAnimationFrame(tick)
        }
        POOL_RAF = requestAnimationFrame(tick)
      }
      // 一帧里可能撞十几下（开球那一下）：只放最响的两声球声 + 一声库边 + 落袋，
      // 并且限流（35 ms 内不重复），否则糊成一片噪音。
      const playEvents = () => {
        const evs = eng.takeEvents()
        if (!evs.length) return
        poolSfx.on = s.poolSfx !== false
        if (!poolSfx.on) return
        const now = Date.now()
        const balls = evs.filter((e) => e.t === 'ball').sort((a, b) => b.v - a.v)
        const rails = evs.filter((e) => e.t === 'rail').sort((a, b) => b.v - a.v)
        const pots = evs.filter((e) => e.t === 'pot').length
        if (pots) { poolPot(); poolSfx.last = now; return }
        if (balls.length && balls[0].v > 3 && now - poolSfx.last > 35) {
          poolClack(balls[0].v)
          if (balls[1] && balls[1].v > 16) poolClack(balls[1].v * 0.6)
          if (rails.length && rails[0].v > 8) poolRail(rails[0].v)
          poolSfx.last = now
        } else if (rails.length && rails[0].v > 10 && now - poolSfx.last > 90) {
          poolRail(rails[0].v)
          poolSfx.last = now
        }
      }
      React.useEffect(() => () => { if (POOL_RAF) { try { cancelAnimationFrame(POOL_RAF) } catch (err) {} POOL_RAF = 0 } }, [])
      // 关窗（含"点工具条按钮收起"）时：把在飞的那一杆算完再落盘 —— 这样存档永远落在静止态，
      // 恢复逻辑只需要处理一种情况。
      React.useEffect(() => {
        if (!s.poolOpen) return undefined
        return () => { try { saveNow() } catch (err) {} }
      }, [s.poolOpen])
      // ⚠️ 画布必须"渲染完就同步一次"：原来只在挂载/事件里画，真实环境里挂载那一刻
      //    ref/布局/dpr 未必就绪 → 打开是空白，得先动一下鼠标才出图（农场也犯过同一个错）。
      React.useEffect(() => { paint() })
      React.useEffect(() => {
        const id = setTimeout(() => { if (mounted.current) paint() }, 50)
        return () => { try { clearTimeout(id) } catch (err) {} }
      }, [])
      // 应用窗口被改小 / 球桌收起还原（高度变了）→ 位置重新夹取，别留在视口外
      React.useEffect(() => {
        const fix = () => setPos((cur) => clampPos(cur.x, cur.y))
        fix()
        if (typeof globalThis.addEventListener === 'function') {
          globalThis.addEventListener('resize', fix)
          return () => { try { globalThis.removeEventListener('resize', fix) } catch (err) {} }
        }
        return undefined
      }, [min])
      // 万一上次是"杆在飞的时候"关掉的（引擎在模块级，局面还活着），重新打开要继续跑完
      React.useEffect(() => {
        if (eng.state().moving) startLoop()
      }, [])

      const toPool = (ev) => {
        const cv = canvasRef.current
        const rect = cv && cv.getBoundingClientRect ? cv.getBoundingClientRect() : { left: 0, top: 0 }
        const m = metrics()
        return {
          x: (ev.clientX - rect.left - m.rail) / m.sc,
          y: (ev.clientY - rect.top - m.rail) / m.sc,
        }
      }
      const cueBall = () => eng.snapshot().balls.filter((b) => b.id === 0)[0]
      const onDown = (ev) => {
        if (askResume || over) return
        const p = toPool(ev)
        const st = eng.state()
        const cb = cueBall()
        // ② 自由球 / 开球：拖母球
        if (cb && !cb.in && (st.inHand || st.phase === 'break') && Math.hypot(cb.x - p.x, cb.y - p.y) <= 3.4) {
          drag.current = { mode: 'place' }
          placeAt.current = { x: cb.x, y: cb.y }
          paint()
          return
        }
        // ③ 出杆：按住 → 往后拉 → 松手
        if (!eng.canShoot()) return
        drag.current = { mode: 'aim', start: p }
        aim.current = { angle: Math.atan2(p.y - cb.y, p.x - cb.x), power: 0 }
        paint()
      }
      const onMove = (ev) => {
        if (askResume || over) return
        const p = toPool(ev)
        if (drag.current && drag.current.mode === 'place') {
          placeAt.current = { x: Math.max(POOL.R, Math.min(POOL.W - POOL.R, p.x)), y: Math.max(POOL.R, Math.min(POOL.H - POOL.R, p.y)) }
          paint()
          return
        }
        if (drag.current && drag.current.mode === 'aim') {
          const d = Math.hypot(p.x - drag.current.start.x, p.y - drag.current.start.y)
          aim.current = { angle: aim.current.angle, power: Math.max(0, Math.min(1, d / POOL_VIEW.pullFull)) }
          paint()
          return
        }
        const cb = cueBall()
        if (!cb || cb.in || !eng.canShoot()) return
        aim.current = { angle: Math.atan2(p.y - cb.y, p.x - cb.x), power: aim.current.power }
        paint()
      }
      const onUp = () => {
        if (askResume || over) { drag.current = null; return }
        const d = drag.current
        drag.current = null
        if (d && d.mode === 'place' && placeAt.current) {
          const ok = eng.place(placeAt.current.x, placeAt.current.y)
          placeAt.current = null
          setHud(hudOf())
          paint()
          if (ok) saveNow()
          return
        }
        if (d && d.mode === 'aim') {
          const okShot = eng.shoot({ angle: aim.current.angle, power: aim.current.power })
          aim.current = { angle: aim.current.angle, power: 0 }
          if (okShot) {
            poolSfx.on = s.poolSfx !== false
            poolCue()
            setHud(hudOf())
            startLoop()
          } else paint()
        }
      }

      // 标题栏拖动（pointer capture，不需要给 document 挂监听）
      const dragWin = React.useRef(null)
      const onTitleDown = (ev) => {
        // ⚠️ 按在子按钮/提示上时**绝不能开始拖动**：一旦 setPointerCapture，
        // 浏览器会把随后的 click 派发给捕获元素（标题栏），子按钮的 onClick 永远不会触发 ——
        // 这正是"缩小/关闭点了没反应"的真因（用户实测）。
        const t = ev && ev.target
        if (t && typeof t.closest === 'function' && t.closest('button,[data-nodrag]')) return
        dragWin.current = { dx: ev.clientX - pos.x, dy: ev.clientY - pos.y }
        if (ev.currentTarget && ev.currentTarget.setPointerCapture && ev.pointerId !== undefined) {
          try { ev.currentTarget.setPointerCapture(ev.pointerId) } catch (err) {}
        }
      }
      const onTitleMove = (ev) => {
        if (!dragWin.current) return
        setPos(clampPos(ev.clientX - dragWin.current.dx, ev.clientY - dragWin.current.dy))
      }
      const onTitleUp = () => {
        if (dragWin.current) {
          dragWin.current = null
          setPos((cur) => {
            const fixed = clampPos(cur.x, cur.y)
            try { posStore.write(fixed) } catch (err) {}
            return fixed
          })
        }
      }
      // 双击标题栏 = 回到默认位置与默认大小（拖到别扭地方时的一键救援）
      const onTitleDouble = () => {
        setK(1)
        try { sizeStore.write(1) } catch (err) {}
        const dp = defaultPos()
        setPos(dp)
        try { posStore.write(dp) } catch (err) {}
      }

      // ---- 拖边缘改大小 ----
      // 只做**统一缩放**：窗口尺寸 = 基准 × k。自由拉伸会让球变成椭圆，球台也不成比例。
      // 手柄三种：右下角（对角）、右边缘（只按宽度）、下边缘（只按高度）。
      const resizing = React.useRef(null)
      const onResizeDown = (mode) => (ev) => {
        if (ev && typeof ev.preventDefault === 'function') ev.preventDefault()
        resizing.current = { mode, last: k }
        if (ev && ev.currentTarget && typeof ev.currentTarget.setPointerCapture === 'function' && ev.pointerId !== undefined) {
          try { ev.currentTarget.setPointerCapture(ev.pointerId) } catch (err) {}
        }
      }
      const sizeFromPointer = (mode, mx, my) => {
        const bw = POOL_VIEW.w
        const bh = POOL_VIEW.h
        const dx = (mx - pos.x) / bw
        const dy = (my - pos.y) / bh
        const raw = mode === 'right' ? dx : mode === 'bottom' ? dy : Math.min(dx, dy)
        // 也别撑出视口：撑出去就被裁掉了，等于自己把窗口弄丢（同一类坑）
        const vw = globalThis.innerWidth || 1200
        const vh = globalThis.innerHeight || 800
        const fixedH = min ? POOL_VIEW.titleH : (24 + 44 + POOL_VIEW.titleH)
        const maxByW = (vw - pos.x - 8) / bw
        const maxByH = (vh - pos.y - fixedH - 8) / bh
        return POOL_VIEW.clampK(Math.min(raw, maxByW, maxByH))
      }
      const onResizeMove = (ev) => {
        if (!resizing.current) return
        const nk = sizeFromPointer(resizing.current.mode, ev.clientX, ev.clientY)
        resizing.current.last = nk
        setK(nk)
        // 立刻按**新**尺寸重画：CSS 尺寸已经变了，但画布位图要等 paint() 才跟得上 ——
        // 不补这一下，缩放过程中看到的是被拉伸的旧画面（用户实测"很突兀"）。
        // 这里必须把 nk 显式传进去：此刻 React 还没重渲染，闭包里的 k 还是旧值。
        paint(nk)
      }
      const onResizeUp = () => {
        if (!resizing.current) return
        const last = resizing.current.last
        resizing.current = null
        try { sizeStore.write(last) } catch (err) {}
        // 变大了可能顶出视口 —— 收手时重新夹一次位置，并按最终尺寸补一次绘制
        setPos((cur) => clampPos(cur.x, cur.y))
        paint(last)
      }
      // 电脑回合：等 700 ms（像人在想）再出杆；它连续进球时会一杆接一杆。
      // ⚠️ 这里直接读 store 的 `poolVs`，不引用下面才声明的派生变量 `vsCpu` ——
      //    夹具里的 useEffect 是渲染过程中同步执行的，引用后声明的 const 会踩暂时性死区。
      React.useEffect(() => {
        if (!s.poolOpen || s.poolVs === 'human' || askResume || over || min) return undefined
        if (hud.turn !== 1 || hud.phase === 'over' || hud.moving) return undefined
        const id = setTimeout(() => {
          let shot = null
          // create 传进去才会做"试打验证"（克隆局面真跑一遍），否则只有纯几何估算
          try { shot = poolCpuShot(eng, { level: s.poolCpu || 'normal', create: makeEngine }) } catch (err) { shot = null }
          if (!shot) return
          if (eng.shoot(shot)) {
            setHud(hudOf())
            startLoop()
          }
        }, 700)
        return () => { try { clearTimeout(id) } catch (err) {} }
      }, [s.poolOpen, s.poolVs, s.poolCpu, askResume, over, min, hud.turn, hud.phase, hud.moving])

      if (!s.poolOpen) return null

      const face = faceOf(s.scheme)
      const vsCpu = s.poolVs !== 'human'
      const groupName = (gp) => (gp === 'solid' ? '全色 1-7' : gp === 'stripe' ? '花色 9-15' : '未定组')
      const who = (i) => (i === 0 ? (s.nickname || DEFAULT_NICK) : (vsCpu ? '电脑' : '玩家 2'))
      const bar = { border: '1px solid ' + IM_EDGE, background: '#ffffff', boxShadow: bevel(face, IM_EDGE) }
      const btnStyle = {
        border: '1px solid ' + IM_EDGE, background: 'linear-gradient(#ffffff,#e6eef8)', color: '#1a1a1a',
        font: '11px/1.5 SimSun, serif', padding: '2px 8px', cursor: 'pointer', pointerEvents: 'auto',
      }
      const rows = []
      const m = metrics()
      rows.push(h('div', {
        key: 'title',
        onPointerDown: onTitleDown, onPointerMove: onTitleMove, onPointerUp: onTitleUp,
        onDoubleClick: onTitleDouble,
        title: '拖动移动；双击回到默认位置（窗口只能留在应用窗口内 —— 浮层出不去）',
        style: {
          display: 'flex', alignItems: 'center', gap: 6, padding: '0 4px 0 7px', cursor: 'move',
          height: m.titleH, boxSizing: 'border-box', overflow: 'hidden',
          background: IM_BLUE, color: '#ffffff',
          font: 'bold ' + Math.max(10, Math.round(12 * k)) + 'px/1.6 SimSun, serif',
          borderTopLeftRadius: 3, borderTopRightRadius: 3,
          // ⚠️ 外层容器是 pointer-events:none，拖动区必须自己打开 —— 否则整条标题栏
          // 收不到指针事件，既拖不动、也点不到（子按钮虽有 auto，但父级没有就白搭）
          pointerEvents: 'auto',
        },
      }, [
        h('span', { key: 't', style: { flex: '1 1 auto' } }, '美式八球'),
        s.poolHint
          ? h('span', {
            key: 'hint',
            // 这个提示自己有点击行为（消除），所以标成"拖动豁免区"
            'data-nodrag': '1',
            title: 'AI 回复完成了 —— 窗口不动，你自己决定什么时候看',
            onClick: () => store.set({ poolHint: '' }),
            style: { cursor: 'pointer', color: '#ffe14d', fontSize: 11, pointerEvents: 'auto' },
          }, s.poolHint + ' ✕')
          : null,
        h('button', {
          key: 'min', type: 'button', title: min ? '还原球桌' : '收起成一条标题栏（局面保留）',
          onClick: () => { saveNow(); setMin(!min) },
          style: { ...btnStyle, background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.45)', padding: '0 6px' },
        }, min ? '▣' : '─'),
        h('button', {
          key: 'x', type: 'button', title: '关闭球桌（先存盘，下次点「美式八球」可继续）',
          onClick: () => { saveNow('已收好球局：' + stampNote()); store.set({ poolOpen: false }) },
          style: { ...btnStyle, background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.45)', padding: '0 6px' },
        }, '✕'),
      ]))

      if (!min) {
        rows.push(h('div', {
          key: 'hud',
          className: 'dsh-skin-im2005-pool-hud',
          // ⚠️ 高度写死 + nowrap：这一行有 6 个元素（轮到谁/杆数/比分/最佳/对手/难度/音效），
          //    窄的时候会换行 —— 一换行整个窗口高度就变，看起来就是"界面在跳"。
          //    固定高度 + 溢出裁掉，换行不再影响布局。
          style: {
            display: 'flex', gap: 6, alignItems: 'center', padding: '0 7px',
            background: '#eef3fb', borderBottom: '1px solid ' + IM_EDGE,
            font: m.fs + 'px/1.5 SimSun, serif', color: '#1a1a1a',
            height: m.hudH, boxSizing: 'border-box', flexWrap: 'nowrap',
            whiteSpace: 'nowrap', overflow: 'hidden',
          },
        }, [
          // 左组：可以截断（窄窗时先牺牲它）
          h('span', { key: 'left', style: { flex: '1 1 auto', minWidth: 0, overflow: 'hidden', display: 'flex', gap: 6, alignItems: 'center' } }, [
            h('span', { key: 'turn', style: { fontWeight: 'bold', color: IM_BLUE_DEEP } }, '轮到 ' + who(hud.turn)),
            h('span', { key: 'grp', style: { overflow: 'hidden', textOverflow: 'ellipsis' } }, hud.groups[hud.turn] ? groupName(hud.groups[hud.turn]) : (hud.open ? '台面开放' : '')),
          ]),
          // 右组：杆数/比分/最佳/三个按钮 —— 一律不许被裁（flexShrink:0）
          h('span', { key: 'shots', style: { flexShrink: 0 } }, '杆数 ' + (hud.shots[0] + hud.shots[1])),
          h('span', { key: 'score', style: { flexShrink: 0 } }, '比分 ' + hud.wins[0] + ':' + hud.wins[1]),
          hud.best ? h('span', { key: 'best', style: { flexShrink: 0 } }, '最佳 ' + hud.best + ' 杆') : null,
          h('button', {
            key: 'vs', type: 'button', style: btnStyle,
            style: { ...btnStyle, flexShrink: 0, fontSize: m.fs, padding: Math.round(2 * k) + 'px ' + Math.round(8 * k) + 'px' },
            title: vsCpu ? '现在跟电脑打（点一下改成两人同机轮流）' : '现在两人同机轮流（点一下改成跟电脑打）',
            onClick: () => { try { if (store.setPoolVs) store.setPoolVs(vsCpu ? 'human' : 'cpu') } catch (err) {} },
          }, vsCpu ? '对手：电脑' : '对手：双人'),
          vsCpu ? h('button', {
            key: 'lv', type: 'button', style: { ...btnStyle, flexShrink: 0, fontSize: m.fs, padding: Math.round(2 * k) + 'px ' + Math.round(8 * k) + 'px' },
            title: '电脑难度（简单 = 瞄得歪，困难 = 打得准）',
            onClick: () => { try { if (store.setPoolLevel) store.setPoolLevel(poolCpuNextLevel(s.poolCpu)) } catch (err) {} },
          }, '难度：' + (POOL_CPU_LABELS[s.poolCpu] || POOL_CPU_LABELS.normal)) : null,
          h('button', {
            key: 'sfx', type: 'button', style: { ...btnStyle, flexShrink: 0, fontSize: m.fs, padding: Math.round(2 * k) + 'px ' + Math.round(8 * k) + 'px' },
            title: '台球音效：球撞球 / 撞库 / 落袋（全部现场合成，没有第三方音频文件）',
            onClick: () => { try { if (store.setPoolSfx) store.setPoolSfx(s.poolSfx === false) } catch (err) {} },
          }, '音效：' + (s.poolSfx === false ? '关' : '开')),
        ]))
        rows.push(h('canvas', {
          key: 'cv', ref: canvasRef,
          width: m.w, height: m.h,
          onMouseDown: onDown, onMouseMove: onMove, onMouseUp: onUp, onMouseLeave: () => { drag.current = null; placeAt.current = null; paint() },
          style: { display: 'block', width: m.w + 'px', height: m.h + 'px', cursor: 'crosshair', pointerEvents: 'auto', touchAction: 'none' },
        }))
        rows.push(h('div', {
          key: 'tip',
          className: 'dsh-skin-im2005-pool-tip',
          // ⚠️ 固定成"两行的高度"（11px × 1.6 × 2 + 上下留白 = 44），溢出裁掉。
          //    提示文案长短差别很大（"自由球…"一行就够，报犯规原因会折成两行），
          //    不锁高度的话窗口高度会随提示换行而变 —— 用户看到的"界面在跳"就是这个。
          style: {
            padding: '3px 7px 5px', background: '#eef3fb', font: m.fs + 'px/1.6 SimSun, serif',
            color: '#333', borderTop: '1px solid ' + IM_EDGE,
            height: m.tipH, boxSizing: 'border-box', overflow: 'hidden',
          },
        }, hud.phase === 'over'
          ? (who(hud.winner === 0 ? 0 : 1) + ' 获胜')
          : (vsCpu && hud.turn === 1)
            ? '电脑在想…'
            : (hud.inHand || hud.phase === 'break')
              ? (hud.phase === 'break' ? '开球：拖母球可换位（需在开球线左侧）；出杆＝在母球外侧按住往后拉' : '自由球：拖母球可摆放；出杆＝在母球外侧按住往后拉')
              : (hud.message || '在球桌上按住鼠标往后拉 → 松手出杆')))
      }

      if (askResume) {
        const sv = save.read() || {}
        rows.push(h('div', {
          key: 'ask',
          style: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto' },
        }, h('div', { style: { ...bar, padding: 10, width: 330, textAlign: 'center' } }, [
          h('div', { key: 'q', style: { font: '12px/1.8 SimSun, serif', color: '#1a1a1a', marginBottom: 8 } },
            '上次那局还没打完，要从哪儿开始？\n（' + stampNote() + '）'),
          h('div', { key: 'b', style: { display: 'flex', gap: 8, justifyContent: 'center' } }, [
            h('button', { key: 'go', type: 'button', style: btnStyle, onClick: () => { setAskResume(false); setHud(hudOf()); paint() } }, '继续打完'),
            h('button', { key: 'new', type: 'button', style: btnStyle, onClick: () => {
              eng.reset({ starter: 0, seed: (Date.now() % 100000) + 1 })
              save.write(eng.serialize())
              setAskResume(false); setOver(null); setHud(hudOf()); paint()
            } }, '重新开局'),
          ]),
        ])))
      }

      if (over) {
        rows.push(h('div', {
          key: 'over',
          style: { position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto' },
        }, h('div', { style: { ...bar, padding: 12, width: 260, textAlign: 'center' } }, [
          h('div', { key: 'w', style: { font: 'bold 13px/1.9 SimSun, serif', color: IM_BLUE_DEEP, marginBottom: 8 } },
            who(over.winner === 0 ? 0 : 1) + ' 获胜！'),
          h('button', {
            key: 'again', type: 'button', style: btnStyle,
            onClick: () => {
              eng.reset({ starter: 1 - (over.winner || 0), seed: (Date.now() % 100000) + 1 })
              save.write(eng.serialize())
              setOver(null); setHud(hudOf()); paint()
            },
          }, '再来一局'),
        ])))
      }

      // 缩放手柄：右下角三角 + 右边缘 + 下边缘。
      // ⚠️ 三个都得自己写 pointerEvents:'auto' —— 外层容器是 none，是**继承**属性，
      //    不写就整条边缘收不到指针事件（和标题栏那次一模一样的坑）。
      const gripW = Math.max(6, Math.round(7 * k))
      const gripC = Math.max(14, Math.round(16 * k))
      const grip = (key, mode, style, kids) => h('div', {
        key, className: 'dsh-skin-im2005-pool-resize', 'data-nodrag': '1',
        title: mode === 'right' ? '拖动改宽（双击标题栏恢复默认大小）'
          : mode === 'bottom' ? '拖动改高（双击标题栏恢复默认大小）'
            : '拖动改大小（双击标题栏恢复默认大小）',
        onPointerDown: onResizeDown(mode), onPointerMove: onResizeMove, onPointerUp: onResizeUp,
        style: { position: 'absolute', pointerEvents: 'auto', zIndex: 3, ...style },
      }, kids)
      const tri = Math.max(8, Math.round(11 * k))
      rows.push(grip('rz-br', 'corner', { right: 0, bottom: 0, width: gripC, height: gripC, cursor: 'nwse-resize' },
        h('div', { style: { position: 'absolute', right: 2, bottom: 2, width: 0, height: 0, borderLeft: tri + 'px solid transparent', borderBottom: tri + 'px solid ' + IM_EDGE_STRONG, opacity: 0.75 } })))
      rows.push(grip('rz-r', 'right', { right: 0, top: m.hudH + m.titleH, bottom: gripC, width: gripW, cursor: 'ew-resize' }))
      rows.push(grip('rz-b', 'bottom', { left: 0, right: gripC, bottom: 0, height: gripW, cursor: 'ns-resize' }))

      return h('div', {
        className: 'dsh-skin-im2005-pool',
        style: {
          position: 'fixed', left: pos.x, top: pos.y, width: m.w + 2,
          background: face, border: '1px solid ' + IM_EDGE_STRONG, boxShadow: '2px 3px 10px rgba(0,0,0,0.35)',
          zIndex: POOL_VIEW.z, pointerEvents: 'none', borderRadius: 4,
        },
      }, rows)
    }
    /* GAME-VIEW:END */

    /* NOTE-VIEW:BEGIN */
    const NOTE_VIEW = { w: 340, pad: 7, taH: 176, titleH: 28, footH: 24 }
    NOTE_VIEW.winW = NOTE_VIEW.w + 2
    NOTE_VIEW.winH = NOTE_VIEW.titleH + NOTE_VIEW.pad + NOTE_VIEW.taH + NOTE_VIEW.footH + 2
    const ImNoteWindow = (props) => {
      const s = useStore()
      const textStore = props.text || { read: readNoteText, write: writeNoteText }
      const posStore = props.pos || { read: readNotePos, write: writeNotePos }
      const openStore = props.openFlag || { read: readNoteOpen, write: writeNoteOpen }
      const boot = React.useRef(null)
      const dragWin = React.useRef(null)
      const taRef = React.useRef(null)
      if (!boot.current) boot.current = { init: textStore.read() }
      const [text, setText] = React.useState(boot.current.init)
      const [min, setMin] = React.useState(false)
      const [saved, setSaved] = React.useState(0)     // 保存次数，用来闪一下"已保存"
      const mounted = React.useRef(true)
      const winW = NOTE_VIEW.winW
      const winH = min ? NOTE_VIEW.titleH : NOTE_VIEW.winH
      const clampPos = (x, y, hgt) => {
        const vw = globalThis.innerWidth || 1200
        const vh = globalThis.innerHeight || 800
        const H = hgt || winH
        return {
          x: Math.max(0, Math.min(Math.max(0, vw - winW), x)),
          y: Math.max(0, Math.min(Math.max(0, vh - H), y)),
        }
      }
      // 默认落在左侧偏上（游戏那两个在右下/左下，别打架）
      const defaultPos = () => clampPos(20, 120)
      const [pos, setPos] = React.useState(() => {
        const p = posStore.read() || defaultPos()
        return clampPos(p.x, p.y)
      })
      React.useEffect(() => () => { mounted.current = false }, [])
      // 应用窗口变小 → 重新夹取
      React.useEffect(() => {
        const fix = () => setPos((cur) => clampPos(cur.x, cur.y))
        if (typeof globalThis.addEventListener === 'function') {
          globalThis.addEventListener('resize', fix)
          return () => { try { globalThis.removeEventListener('resize', fix) } catch (err) {} }
        }
        return undefined
      }, [min])

      const save = (v) => {
        try { textStore.write(v) } catch (err) {}
        if (mounted.current) setSaved((n) => n + 1)
      }
      const onChange = (ev) => {
        const v = ev && ev.target && typeof ev.target.value === 'string' ? ev.target.value : ''
        setText(v)
        save(v)                     // 每次输入都落盘：草稿纸丢了比什么都难受
      }
      // 在框里打字时别让按键冒到宿主那儿（否则可能触发 DSH 的快捷键）
      const onKeyDown = (ev) => {
        if (!ev) return
        if (typeof ev.stopPropagation === 'function') ev.stopPropagation()
        if (ev.nativeEvent && typeof ev.nativeEvent.stopImmediatePropagation === 'function') {
          ev.nativeEvent.stopImmediatePropagation()
        }
      }
      const clearAll = () => { setText(''); save('') }
      const copyAll = () => {
        try {
          const nav = globalThis.navigator
          if (nav && nav.clipboard && typeof nav.clipboard.writeText === 'function') nav.clipboard.writeText(text)
        } catch (err) {}
      }
      const onTitleDown = (ev) => {
        const t = ev && ev.target
        if (t && typeof t.closest === 'function' && t.closest('button,[data-nodrag]')) return
        dragWin.current = { dx: ev.clientX - pos.x, dy: ev.clientY - pos.y }
        if (ev && ev.currentTarget && typeof ev.currentTarget.setPointerCapture === 'function' && ev.pointerId !== undefined) {
          try { ev.currentTarget.setPointerCapture(ev.pointerId) } catch (err) {}
        }
      }
      const onTitleMove = (ev) => {
        if (!dragWin.current) return
        setPos(clampPos(ev.clientX - dragWin.current.dx, ev.clientY - dragWin.current.dy))
      }
      const onTitleUp = () => {
        if (!dragWin.current) return
        dragWin.current = null
        setPos((cur) => {
          const fixed = clampPos(cur.x, cur.y)
          try { posStore.write(fixed) } catch (err) {}
          return fixed
        })
      }
      const onTitleDouble = () => {
        const dp = defaultPos()
        setPos(dp)
        try { posStore.write(dp) } catch (err) {}
      }
      const closeBox = () => {
        save(text)
        try { openStore.write(false) } catch (err) {}
        store.set({ noteOpen: false })
      }

      // 关掉就整个不渲染（内容已经落盘，下次点按钮还在）
      if (!s.noteOpen) return null

      const face = faceOf(s.scheme)
      const btnStyle = {
        border: '1px solid ' + IM_EDGE, background: 'linear-gradient(#ffffff,#e6eef8)', color: '#1a1a1a',
        font: '11px/1.5 SimSun, serif', padding: '2px 8px', cursor: 'pointer', pointerEvents: 'auto',
      }
      const rows = []
      rows.push(h('div', {
        key: 'title',
        onPointerDown: onTitleDown, onPointerMove: onTitleMove, onPointerUp: onTitleUp,
        onDoubleClick: onTitleDouble,
        title: '拖动移动；双击回到默认位置（窗口只能留在应用窗口内）',
        style: {
          display: 'flex', alignItems: 'center', gap: 6, padding: '0 4px 0 7px', cursor: 'move',
          height: NOTE_VIEW.titleH, boxSizing: 'border-box', overflow: 'hidden',
          background: IM_BLUE, color: '#ffffff', font: 'bold 12px/1.6 SimSun, serif',
          borderTopLeftRadius: 3, borderTopRightRadius: 3, pointerEvents: 'auto',
        },
      }, [
        h('span', { key: 't', style: { flex: '1 1 auto' } }, '跨会话备注框'),
        h('button', {
          key: 'min', type: 'button', title: min ? '展开' : '收起成一条标题栏',
          onClick: () => { save(text); setMin(!min) },
          style: { ...btnStyle, background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.45)', padding: '0 6px' },
        }, min ? '▣' : '─'),
        h('button', {
          key: 'x', type: 'button', title: '关掉（内容留着，下次点按钮还在）',
          onClick: closeBox,
          style: { ...btnStyle, background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.45)', padding: '0 6px' },
        }, '✕'),
      ]))

      if (!min) {
        rows.push(h('div', {
          key: 'body',
          style: { padding: NOTE_VIEW.pad, background: face, pointerEvents: 'none' },
        }, h('textarea', {
          key: 'ta',
          ref: taRef,
          className: 'dsh-skin-im2005-note-text',
          value: text,
          placeholder: '在这儿写：切到别的会话要做什么…（内容在所有会话里都能看到）',
          onChange, onKeyDown,
          onBlur: () => save(text),
          'data-nodrag': '1',
          spellCheck: false,
          style: {
            display: 'block', width: '100%', height: NOTE_VIEW.taH, boxSizing: 'border-box',
            padding: '5px 6px', resize: 'none', outline: 'none',
            border: '1px solid ' + IM_EDGE_STRONG, background: '#ffffff', color: '#1a1a1a',
            font: '12px/1.7 SimSun, serif', pointerEvents: 'auto',
          },
        })))
        rows.push(h('div', {
          key: 'foot',
          className: 'dsh-skin-im2005-note-foot',
          style: {
            display: 'flex', alignItems: 'center', gap: 6, padding: '0 7px',
            height: NOTE_VIEW.footH, boxSizing: 'border-box', overflow: 'hidden',
            background: '#eef3fb', borderTop: '1px solid ' + IM_EDGE,
            font: '11px/1.5 SimSun, serif', color: '#333', whiteSpace: 'nowrap',
          },
        }, [
          h('span', { key: 'n', style: { flex: '1 1 auto', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' } },
            (saved > 0 ? '已保存 · ' : '自动保存 · ') + text.length + ' 字 · 切会话不会丢'),
          h('button', { key: 'copy', type: 'button', style: { ...btnStyle, flexShrink: 0 }, title: '把这段字复制到剪贴板', onClick: copyAll }, '复制'),
          h('button', { key: 'clr', type: 'button', style: { ...btnStyle, flexShrink: 0 }, title: '清空（不可撤销）', onClick: clearAll }, '清空'),
        ]))
      }

      return h('div', {
        className: 'dsh-skin-im2005-note',
        style: {
          position: 'fixed', left: pos.x, top: pos.y, width: winW,
          background: face, border: '1px solid ' + IM_EDGE_STRONG, boxShadow: '2px 3px 10px rgba(0,0,0,0.35)',
          zIndex: POOL_VIEW.z, pointerEvents: 'none', borderRadius: 4,
        },
      }, rows)
    }
    /* NOTE-VIEW:END */

    /* ================================================================== *
     * Token农场浮窗：canvas 像素画
     *
     * 为什么用 canvas：像素画要逐点控制（每个像素都是个 fillRect），并且要
     * imageSmoothingEnabled = false 才有那种硬边质感 —— DOM 做这个要靠一堆
     * 1px 的 div，不划算。交互反而简单：整块画布一个点击，自己算落在哪块地。
     *
     * 复用的是八球那套 canvas 基建（dpr 缩放、惰性定尺寸、点击坐标换算）。
     * ================================================================== */
    /* ================================================================== *
     * Token农场浮窗：一株植物，像素画
     *
     * 用户反馈：4×3 网格那版"太丑"，只要一株植物慢慢长。
     * 于是画面简化成：天空 + 云 + 一张木台 + 一个花盆，里面一株植物按进度长高。
     * 交互也简化成一个按钮（按当前状态变"种下/浇水/收获"），点画面等于按按钮。
     *
     * 视觉用 progress 而不是 stage：进度有 6 档，比"4 个阶段"更像"慢慢涨"。
     * ================================================================== */
    /* FARM-VIEW:BEGIN */
    const FARM_VIEW = (() => {
      const w = 330
      const h = 260
      const titleH = 30
      const hudH = 26
      const tipH = 40
      return { w, h, titleH, hudH, tipH, winW: w + 2, winH: titleH + hudH + h + tipH }
    })()
    FARM_VIEW.vsteps = 7          // 视觉档数（0..6，对应 FARM.GROWTH_TIERS）
    let FARM_ENG = null
    /** 一株植物：按 tier（0..6）画，越往后越枝繁叶茂；只增不减 */
    const farmDrawPlant = (g, v, cx, baseY, crop, cycle) => {
      const P = 4
      const px = (n) => Math.round(cx + n * P)
      const py = (n) => Math.round(baseY + n * P)
      const leaf = crop ? crop.leaf : '#3f8f43'
      const leaf2 = '#4f9a3f'
      const fruit = crop ? crop.fruit : '#d43b2f'
      if (v <= 0) {
        g.fillStyle = '#3a2716'
        g.fillRect(px(-1), py(-0.5), P, P)
        g.fillRect(px(1), py(0.5), P, P)
        return
      }
      // 主茎：越高越粗
      const stemH = [5, 8, 12, 16, 20, 22, 22][Math.min(6, v)]
      const stemW = v >= 4 ? 6 : 4
      g.fillStyle = v >= 5 ? '#356f38' : leaf
      g.fillRect(px(-stemW / 8), py(-stemH), stemW, stemH * P)
      // 叶子：档越高层数越多（枝繁叶茂的观感来自"层数"，不是单叶变大）
      const layers = [1, 2, 3, 5, 7, 8, 8][Math.min(6, v)]
      for (let i = 0; i < layers; i++) {
        const y = -stemH + 1.5 + i * Math.max(1.6, (stemH - 2) / (layers + 0.5))
        const dir = i % 2 === 0 ? -1 : 1
        const wide = v >= 4 ? 2.2 : 1.6
        g.fillStyle = i % 3 === 0 ? leaf2 : leaf
        g.fillRect(px(dir < 0 ? -wide - 1 : 1), py(y), Math.round(wide * P), P)
        g.fillRect(px(dir < 0 ? -wide - 2 : 2), py(y + 0.8), P, P)
      }
      // 开花 → 挂果
      if (v >= 5) {
        g.fillStyle = '#f0e19a'
        g.fillRect(px(-2), py(-stemH - 2), 2 * P, P)
        g.fillStyle = '#ffd24a'
        g.fillRect(px(-0.5), py(-stemH - 3), 1.5 * P, P)
      }
      // 到顶之后：每多一轮就多几朵小花（形状封顶了，但画面还在变）
      const extra = Math.max(0, Math.min(6, Number(cycle) || 0))
      for (let i = 0; i < extra; i++) {
        const dx = (i % 2 === 0 ? -1 : 1) * (1 + (i % 3))
        const dy = -stemH + 1 + i * 2
        g.fillStyle = '#f7c6d9'
        g.fillRect(px(dx), py(dy), P, P)
        g.fillStyle = '#ffe27a'
        g.fillRect(px(dx + 0.25), py(dy + 0.25), P / 2, P / 2)
      }
      if (v >= 6) {
        const spots = [[-5, -5], [3, -2], [-4, -12], [2, -14]]
        for (const sp of spots) {
          g.fillStyle = fruit
          g.fillRect(px(sp[0]), py(sp[1]), 2 * P, 2 * P)
          g.fillStyle = 'rgba(255,255,255,0.65)'
          g.fillRect(px(sp[0]), py(sp[1]), P, P)
        }
      }
    }
    const farmDraw = (g, snap) => {
      const V = FARM_VIEW
      const W = V.w
      const H = V.h
      // 天空（渐变用两层横带，保持像素感）
      g.fillStyle = '#cfe9f7'
      g.fillRect(0, 0, W, H)
      g.fillStyle = '#bfe3f5'
      g.fillRect(0, 0, W, Math.round(H * 0.34))
      // 云（两块）
      g.fillStyle = '#ffffff'
      g.fillRect(Math.round(W * 0.14), 28, 34, 10)
      g.fillRect(Math.round(W * 0.14) + 8, 20, 20, 10)
      g.fillRect(Math.round(W * 0.62), 46, 28, 9)
      g.fillRect(Math.round(W * 0.62) + 7, 39, 16, 9)
      // 木台
      const tableY = Math.round(H * 0.78)
      g.fillStyle = '#8a6538'
      g.fillRect(0, tableY, W, H - tableY)
      g.fillStyle = '#6f4f2a'
      g.fillRect(0, tableY, W, 4)
      for (let x = 0; x < W; x += 26) g.fillRect(x, tableY + 6, 2, H - tableY)
      // 花盆
      const potW = 84
      const potX = Math.round((W - potW) / 2)
      const potH = 46
      const potY = tableY - potH + 8
      g.fillStyle = '#b5651d'
      g.fillRect(potX, potY, potW, potH)
      g.fillStyle = '#d07a2e'
      g.fillRect(potX, potY, potW, 6)
      g.fillStyle = '#8f4d12'
      g.fillRect(potX, potY + potH - 6, potW, 6)
      // 盆里的土
      g.fillStyle = '#5b3d22'
      g.fillRect(potX + 4, potY + 4, potW - 8, 10)
      g.fillStyle = '#6b4a2f'
      g.fillRect(potX + 4, potY + 4, potW - 8, 4)
      // 植物
      const crop = snap.plant.crop ? FARM.CROPS[snap.plant.crop] : FARM.CROPS[snap.seed]
      const cyc = Math.max(0, Math.floor((snap.plant.tierAll || 0) / (FARM.MAX_GROWTH + 1)))
      farmDrawPlant(g, snap.plant.crop ? snap.plant.tier : -1, W / 2, potY + 8, crop, cyc)
      // 枝繁叶茂时给个柔和的金边（表示"养成了"），不是"待收"
      if (snap.plant.tier >= 5) {
        g.strokeStyle = 'rgba(255,210,74,0.75)'
        g.lineWidth = 3
        g.strokeRect(potX - 4, potY - 60, potW + 8, potH + 62)
      }
      // 水（左下角几滴水珠）
      const drops = Math.min(6, snap.water)
      for (let i = 0; i < drops; i++) {
        g.fillStyle = '#3f9fe0'
        g.fillRect(10 + i * 12, H - 18, 7, 10)
        g.fillStyle = '#8fd0f5'
        g.fillRect(10 + i * 12, H - 18, 3, 4)
      }
    }
    const FARM_TIP_DEFAULT = '点一下：种下 → 浇水 → 收获'
    const ImFarmWindow = (props) => {
      const s = useStore()
      const save = props.save || { read: readFarmSave, write: writeFarmSave }
      const posStore = props.pos || { read: readFarmPos, write: writeFarmPos }
      const openStore = props.openFlag || { read: readFarmOpen, write: writeFarmOpen }
      const sfxStore = props.sfxPref || { read: readFarmSfx, write: writeFarmSfx }
      const makeEngine = (props.engine && props.engine.create) || createFarmEngine
      const boot = React.useRef(null)
      const canvasRef = React.useRef(null)
      const dragWin = React.useRef(null)
      const mounted = React.useRef(true)
      const [hud, setHud] = React.useState(null)
      const [min, setMin] = React.useState(false)
      const [note, setNote] = React.useState('')
      const [balNote, setBalNote] = React.useState('')
      if (!boot.current) {
        const sv = save.read()
        let eng = FARM_ENG
        let resumed = false
        if (eng) resumed = !!eng.state().plots[0].crop
        else {
          eng = makeEngine({})
          if (sv) resumed = eng.restore(sv)
          if (!resumed) eng.reset()
          FARM_ENG = eng
        }
        boot.current = { eng, resumed }
      }
      const eng = boot.current.eng
      // 视图只认"第 0 块地"= 那一株植物
      const snapOf = () => {
        eng.tickGrowth(0, Date.now())          // 时间自然生长（只增不减）
        const full = eng.snapshot(Date.now())
        return { ...full, plant: full.plots[0] }
      }
      if (hud === null) setHud(snapOf())

      const winW = FARM_VIEW.winW
      const winH = min ? FARM_VIEW.titleH : FARM_VIEW.winH
      const clampPos = (x, y, hgt) => {
        const vw = globalThis.innerWidth || 1200
        const vh = globalThis.innerHeight || 800
        const H2 = hgt || winH
        return {
          x: Math.max(0, Math.min(Math.max(0, vw - winW), x)),
          y: Math.max(0, Math.min(Math.max(0, vh - H2), y)),
        }
      }
      const defaultPos = () => clampPos((globalThis.innerWidth || 1200) - winW - 40, 150)
      const [pos, setPos] = React.useState(() => {
        const p = posStore.read() || defaultPos()
        return clampPos(p.x, p.y)
      })

      const paint = () => {
        const cv = canvasRef.current
        if (!cv || typeof cv.getContext !== 'function') return
        if (cv.__fw !== FARM_VIEW.w || cv.__fh !== FARM_VIEW.h) {
          const dpr = globalThis.devicePixelRatio || 1
          cv.width = FARM_VIEW.w * dpr
          cv.height = FARM_VIEW.h * dpr
          const g0 = cv.getContext('2d')
          if (g0 && typeof g0.setTransform === 'function') {
            g0.setTransform(1, 0, 0, 1, 0, 0)
            g0.scale(dpr, dpr)
          }
          cv.__fw = FARM_VIEW.w
          cv.__fh = FARM_VIEW.h
        }
        const g = cv.getContext('2d')
        if (!g) return
        farmDraw(g, hud || snapOf())
      }
      const commit = (msg) => {
        const st = snapOf()
        setHud(st)
        if (msg !== undefined) setNote(msg)
        try { save.write(eng.serialize()) } catch (err) {}
        paint()
        return st
      }
      /**
       * 农场音效：**默认关**（用户要求），而且必须是"自己的开关"。
       * ⚠️ 底层合成器（pool*）读的是共享的 poolSfx.on —— 所以这里**只读不写**，
       *    绝不能去赋值：那会把别的功能（提醒音、游戏音效）的开关一起改掉（用户实测过）。
       */
      const farmPlay = (fn, arg) => {
        if (s.farmSfx !== true) return false            // 农场关着 → 一声不出
        if (!poolSfx.on) return false                   // 全局音效本来就关着 → 尊重它
        try { return fn(arg) } catch (err) { return false }
      }

      const pullBalance = async () => {
        try {
          const api = store.farmBalance
          if (typeof api !== 'function') { setBalNote('余额驱动不可用（降级为轮次 + 时间）'); return }
          const yuan = await api()
          if (!(typeof yuan === 'number') || !Number.isFinite(yuan)) { setBalNote('余额读取失败（降级为轮次 + 时间）'); return }
          const r = eng.creditBalance(yuan)
          if (!r || !r.ok) { setBalNote('余额读取失败（降级为轮次 + 时间）'); return }
          if (r.first) { setBalNote('余额 ¥' + yuan.toFixed(2) + '（已记为起点）'); commit(); return }
          if (r.topUp) { setBalNote('余额上升（充值不影响生长速度）'); commit(); return }
          if (r.drops > 0) {
            setBalNote('这段时间消耗 ¥' + r.spent.toFixed(2) + ' → +' + r.drops + ' 滴水')
            farmPlay(mineWin)
            commit()
            return
          }
          setBalNote('这段时间消耗 ¥' + r.spent.toFixed(2) + '（不足 1 滴，零头累积中）')
          commit()
        } catch (err) { setBalNote('余额读取失败（降级为轮次 + 时间）') }
      }

      React.useEffect(() => () => { mounted.current = false }, [])
      React.useEffect(() => {
        if (!s.farmOpen) return undefined
        return () => { try { save.write(eng.serialize()) } catch (err) {} }
      }, [s.farmOpen])
      React.useEffect(() => {
        if (s.farmNote) { setHud(snapOf()); setNote(s.farmNote); paint() }
      }, [s.farmNote])
      // 每次渲染后同步一次画布（打开就要有画面）；再兜一次等布局/dpr 落定
      React.useEffect(() => { paint() })
      React.useEffect(() => {
        pullBalance()
        const id = setTimeout(() => { if (mounted.current) paint() }, 50)
        const fix = () => setPos((cur) => clampPos(cur.x, cur.y))
        if (typeof globalThis.addEventListener === 'function') {
          globalThis.addEventListener('resize', fix)
          return () => {
            try { clearTimeout(id) } catch (err) {}
            try { globalThis.removeEventListener('resize', fix) } catch (err) {}
          }
        }
        return () => { try { clearTimeout(id) } catch (err) {} }
      }, [])

      /** 那一个动作：还没种 → 种下；种了 → 浇水（**没有收菜**，这一株一直养着） */
      const doAction = () => {
        const st = hud || snapOf()
        if (!st.plant.crop) {
          if (eng.setPlant(st.seed, Date.now())) {
            farmPlay(mineOpen)
            commit('种下了' + FARM.CROPS[st.seed].name)
          }
          return
        }
        if (eng.addGrowth(0, 1) && eng.water(0)) {
          farmPlay(mineFlag)
          const after = commit('浇了 1 滴水')
          if (after.plant.tier !== st.plant.tier) setNote('长到「' + after.plant.tierName + '」')
        } else {
          commit('水不够了：每完成一轮 AI 回复 +1 滴，余额每降 ¥' + FARM.MONEY_STEP.toFixed(2) + ' +1 滴')
        }
      }

      const onTitleDown = (ev) => {
        const t = ev && ev.target
        if (t && typeof t.closest === 'function' && t.closest('button,[data-nodrag]')) return
        dragWin.current = { dx: ev.clientX - pos.x, dy: ev.clientY - pos.y }
        if (ev && ev.currentTarget && typeof ev.currentTarget.setPointerCapture === 'function' && ev.pointerId !== undefined) {
          try { ev.currentTarget.setPointerCapture(ev.pointerId) } catch (err) {}
        }
      }
      const onTitleMove = (ev) => {
        if (!dragWin.current) return
        setPos(clampPos(ev.clientX - dragWin.current.dx, ev.clientY - dragWin.current.dy))
      }
      const onTitleUp = () => {
        if (!dragWin.current) return
        dragWin.current = null
        setPos((cur) => {
          const fixed = clampPos(cur.x, cur.y)
          try { posStore.write(fixed) } catch (err) {}
          return fixed
        })
      }
      const onTitleDouble = () => {
        const dp = defaultPos()
        setPos(dp)
        try { posStore.write(dp) } catch (err) {}
      }
      const closeWin = () => {
        try { save.write(eng.serialize()) } catch (err) {}
        try { openStore.write(false) } catch (err) {}
        store.set({ farmOpen: false })
      }

      if (!s.farmOpen) return null

      const face = faceOf(s.scheme)
      const st = hud || snapOf()
      const btnStyle = {
        border: '1px solid ' + IM_EDGE, background: 'linear-gradient(#ffffff,#e6eef8)', color: '#1a1a1a',
        font: '11px/1.5 SimSun, serif', padding: '2px 8px', cursor: 'pointer', pointerEvents: 'auto',
      }
      const rows = []
      rows.push(h('div', {
        key: 'title',
        onPointerDown: onTitleDown, onPointerMove: onTitleMove, onPointerUp: onTitleUp,
        onDoubleClick: onTitleDouble,
        title: '拖动移动；双击回到默认位置（窗口只能留在应用窗口内）',
        style: {
          display: 'flex', alignItems: 'center', gap: 6, padding: '0 4px 0 7px', cursor: 'move',
          height: FARM_VIEW.titleH, boxSizing: 'border-box', overflow: 'hidden',
          background: IM_BLUE, color: '#ffffff', font: 'bold 12px/1.6 SimSun, serif',
          borderTopLeftRadius: 3, borderTopRightRadius: 3, pointerEvents: 'auto',
        },
      }, [
        h('span', { key: 't', style: { flex: '1 1 auto' } }, 'Token农场'),
        s.poolHint
          ? h('span', {
            key: 'hint', 'data-nodrag': '1',
            title: 'AI 回复完成了 —— 窗口不动，你自己决定什么时候看',
            onClick: () => store.set({ poolHint: '' }),
            style: { cursor: 'pointer', color: '#ffe14d', fontSize: 11, pointerEvents: 'auto' },
          }, s.poolHint + ' ✕')
          : null,
        h('button', {
          key: 'min', type: 'button', title: min ? '展开' : '收起成一条标题栏',
          onClick: () => { commit(); setMin(!min) },
          style: { ...btnStyle, background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.45)', padding: '0 6px' },
        }, min ? '▣' : '─'),
        h('button', {
          key: 'x', type: 'button', title: '关闭农场（先存盘，下次点「Token农场」接着看）',
          onClick: closeWin,
          style: { ...btnStyle, background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.45)', padding: '0 6px' },
        }, '✕'),
      ]))

      if (!min) {
        rows.push(h('div', {
          key: 'hud',
          className: 'dsh-skin-im2005-farm-hud',
          style: {
            display: 'flex', gap: 6, alignItems: 'center', padding: '0 7px',
            background: '#eef3fb', borderBottom: '1px solid ' + IM_EDGE,
            font: '11px/1.5 SimSun, serif', color: '#1a1a1a',
            height: FARM_VIEW.hudH, boxSizing: 'border-box', flexWrap: 'nowrap',
            whiteSpace: 'nowrap', overflow: 'hidden',
          },
        }, [
          h('span', { key: 'l', style: { flex: '0 0 auto', display: 'flex', gap: 8, alignItems: 'center', whiteSpace: 'nowrap' } }, [
            h('span', { key: 'w', style: { fontWeight: 'bold', color: '#1f6fb2' } }, '水 ' + st.water),
          ]),
          h('span', { key: 'sp', style: { flex: '1 1 auto' } }),
          h('button', {
            key: 'seed', type: 'button', style: { ...btnStyle, flexShrink: 0 },
            title: '换种子',
            onClick: () => {
              const nx = FARM.ORDER[(FARM.ORDER.indexOf(st.seed) + 1) % FARM.ORDER.length]
              // 换植物：只换品种，**已经长出来的部分保留**
              if (eng.setPlant(nx, Date.now())) commit('换成了' + FARM.CROPS[nx].name)
            },
          }, '植物：' + FARM.CROPS[st.seed].name),
          h('button', {
            key: 'bal', type: 'button', style: { ...btnStyle, flexShrink: 0 },
            title: '重新读一次余额（消耗换算成水；不做后台轮询，省电）',
            onClick: () => { pullBalance() },
          }, '↻ 余额'),
          h('button', {
            key: 'sfx', type: 'button', style: { ...btnStyle, flexShrink: 0 },
            title: '农场音效（默认关闭；和其它小游戏各自独立）',
            onClick: () => { try { if (store.setFarmSfx) store.setFarmSfx(s.farmSfx !== true) } catch (err) {} },
          }, '音效：' + (s.farmSfx === true ? '开' : '关')),
        ]))
        rows.push(h('div', {
          key: 'field', style: { background: face, pointerEvents: 'none', padding: 0, lineHeight: 0 },
        }, h('canvas', {
          key: 'cv', ref: canvasRef,
          className: 'dsh-skin-im2005-farm-canvas',
          onClick: doAction,
          style: {
            display: 'block', width: FARM_VIEW.w + 'px', height: FARM_VIEW.h + 'px',
            cursor: 'pointer', pointerEvents: 'auto', touchAction: 'none',
          },
        })))
        rows.push(h('div', {
          key: 'tip',
          className: 'dsh-skin-im2005-farm-tip',
          style: {
            padding: '3px 7px 5px', background: '#eef3fb', font: '11px/1.6 SimSun, serif',
            color: '#333', borderTop: '1px solid ' + IM_EDGE,
            height: FARM_VIEW.tipH, boxSizing: 'border-box', overflow: 'hidden',
          },
        }, [
          h('div', { key: 'a' }, note || (st.plant.crop
            ? FARM.CROPS[st.plant.crop].name + ' · ' + st.plant.tierName + ' · 生长 ' + Math.floor(st.plant.growth) + ' · 点它浇水'
            : FARM_TIP_DEFAULT)),
          h('div', { key: 'b', style: { color: '#666' } }, balNote || '每完成一轮 AI 回复 +1 滴水；余额每降 ¥0.10 +1 滴'),
        ]))
      }

      return h('div', {
        className: 'dsh-skin-im2005-farm',
        style: {
          position: 'fixed', left: pos.x, top: pos.y, width: winW,
          background: face, border: '1px solid ' + IM_EDGE_STRONG, boxShadow: '2px 3px 10px rgba(0,0,0,0.35)',
          zIndex: POOL_VIEW.z, pointerEvents: 'none', borderRadius: 4,
        },
      }, rows)
    }
    /* FARM-VIEW:END */



    /* ================================================================== *
     * 扫雷浮窗（20×20）
     *
     * 用 DOM 网格而不是 canvas：扫雷没有物理，格子数固定（400），
     * DOM 换来的是清晰的数字/描边 + 原生的右键（插旗）与双击（连开）——
     * canvas 反而要自己实现命中判定与右键语义。八球那套 canvas 基建留给需要物理的游戏。
     *
     * 复用八球验证过的四条：独立浮窗 + 整窗夹取 + 局面即存档 + 任务完成只闪提示。
     * ================================================================== */
    /* GAME-MINE-VIEW:BEGIN */
    const MINE_VIEW = (() => {
      const pad = 7
      const cell = MINE.CELL
      const w = pad * 2 + MINE.W * cell
      const h = pad * 2 + MINE.H * cell
      return { pad, cell, w, h, titleH: 30, hudH: 26, tipH: 40, winW: w + 2, winH: 30 + 26 + h + 40 }
    })()
    // 经典扫雷数字配色（1 蓝 2 绿 3 红 4 深蓝 5 深红 6 青 7 黑 8 灰）
    const MINE_NUM_COLOR = {
      1: '#0000ff', 2: '#008000', 3: '#ff0000', 4: '#000080',
      5: '#800000', 6: '#008080', 7: '#000000', 8: '#808080',
    }
    let MINE_ENG = null            // 模块级会话：窗口关掉再开，局面还在
    const ImMineWindow = (props) => {
      const s = useStore()
      const save = props.save || { read: readMineSave, write: writeMineSave, clear: clearMineSave }
      const posStore = props.pos || { read: readMinePos, write: writeMinePos }
      const levelStore = props.level || { read: readMineLevel, write: writeMineLevel }
      const bestStore = props.best || { read: readMineBest, write: writeMineBest }
      const makeEngine = (props.engine && props.engine.create) || createMineEngine
      const boot = React.useRef(null)
      const dragWin = React.useRef(null)

      if (!boot.current) {
        const sv = save.read()
        let eng = MINE_ENG
        let resumed = false
        if (eng) {
          // 本次会话里已经有一局（哪怕刚关掉窗口）—— 直接接着打，不再问
          resumed = eng.snapshot().state !== 'ready'
        } else {
          eng = makeEngine({ level: s.mineLevel || levelStore.read() })
          if (sv) resumed = eng.restore(sv)
          if (!resumed) eng.reset(s.mineLevel || levelStore.read())
          MINE_ENG = eng
        }
        boot.current = { eng, resumed }
      }
      const eng = boot.current.eng
      const best = React.useRef(bestStore.read())
      const [hud, setHud] = React.useState(() => eng.snapshot())
      const [min, setMin] = React.useState(false)
      const [newBest, setNewBest] = React.useState(false)
      const mounted = React.useRef(true)
      const winW = MINE_VIEW.winW
      const winH = min ? MINE_VIEW.titleH : MINE_VIEW.winH
      const clampPos = (x, y, hgt) => {
        const vw = globalThis.innerWidth || 1200
        const vh = globalThis.innerHeight || 800
        const H = hgt || winH
        return {
          x: Math.max(0, Math.min(Math.max(0, vw - winW), x)),
          y: Math.max(0, Math.min(Math.max(0, vh - H), y)),
        }
      }
      // 默认落在左下角（八球在右下角）—— 两个都开着也不会叠在一起
      const defaultPos = () => clampPos(16, (globalThis.innerHeight || 800) - MINE_VIEW.winH - 90)
      const [pos, setPos] = React.useState(() => {
        const p = posStore.read() || defaultPos()
        return clampPos(p.x, p.y)
      })

      React.useEffect(() => () => { mounted.current = false }, [])
      React.useEffect(() => {
        if (!s.mineOpen) return undefined
        return () => { try { save.write(eng.serialize()) } catch (err) {} }
      }, [s.mineOpen])
      // 计时显示 + 位置重新夹取（窗口被改小后别留在视口外）
      React.useEffect(() => {
        const tick = () => { if (mounted.current) setHud(eng.snapshot()) }
        const id = setInterval(tick, 500)
        const fix = () => setPos((cur) => clampPos(cur.x, cur.y))
        if (typeof globalThis.addEventListener === 'function') {
          globalThis.addEventListener('resize', fix)
          return () => {
            try { clearInterval(id) } catch (err) {}
            try { globalThis.removeEventListener('resize', fix) } catch (err) {}
          }
        }
        return () => { try { clearInterval(id) } catch (err) {} }
      }, [])

      // 每步结束都写盘：扫雷局面极小，"随时暂停"就是"随时序列化"
      const commit = () => {
        const st = eng.snapshot()
        if (st.state === 'won') {
          const cur = best.current[st.level]
          if (cur === null || st.elapsed < cur) {
            best.current = { ...best.current, [st.level]: st.elapsed }
            try { bestStore.write(best.current) } catch (err) {}
            setNewBest(true)
          }
          try { clearMineSave() } catch (err) {}
        } else if (st.state === 'lost') {
          try { clearMineSave() } catch (err) {}
        } else {
          try { save.write(eng.serialize()) } catch (err) {}
        }
        setHud(st)
      }
      const sfxOn = () => {
        poolSfx.on = s.poolSfx !== false
        return poolSfx.on
      }
      // 连开的落地方式：**点一下**满足条件的数字就开（不必非得双击）。
      // 原来只挂了 onDoubleClick，用户实测"要双击两次才连开" —— 双击在真实浏览器里还受
      // "两下是否落在同一节点、间隔多久"影响；把判断交给引擎就稳了：chord() 只在
      // "已翻开 + 是数字 + 周围旗数正好等于数字"时动手，其余一律 false，
      // 所以"先试 chord、失败再 tap"是安全的 —— 一次点击覆盖两种意图。
      const afterAction = () => {
        const st = eng.snapshot()
        sfxOn()
        if (st.state === 'lost') mineBoom()
        else if (st.state === 'won') mineWin()
        else mineOpen()
        commit()
      }
      const onCell = (i) => () => {
        if (eng.chord(i)) { afterAction(); return }
        if (!eng.tap(i)) return
        afterAction()
      }
      const onCellFlag = (i) => (ev) => {
        if (ev && typeof ev.preventDefault === 'function') ev.preventDefault()
        if (!eng.flag(i)) return
        sfxOn()
        mineFlag()
        commit()
      }
      const onCellChord = (i) => () => {
        if (!eng.chord(i)) return
        afterAction()
      }
      // 中键 = 经典连开手势（Chromium 中键默认触发自动滚动，得把 mousedown 挡掉）
      const onCellMidDown = (ev) => {
        if (ev && ev.button === 1 && typeof ev.preventDefault === 'function') ev.preventDefault()
      }
      const onCellMid = (i) => (ev) => {
        if (!ev || ev.button !== 1) return
        if (typeof ev.preventDefault === 'function') ev.preventDefault()
        if (!eng.chord(i)) return
        afterAction()
      }
      const restart = (lv) => {
        const level = lv || hud.level
        eng.reset(level)
        try { save.write(eng.serialize()) } catch (err) {}
        setNewBest(false)
        setHud(eng.snapshot())
      }
      const switchLevel = () => {
        const nv = mineNextLevel(hud.level)
        try { if (store.setMineLevel) store.setMineLevel(nv) } catch (err) {}
        restart(nv)
      }
      const onTitleDown = (ev) => {
        const t = ev && ev.target
        if (t && typeof t.closest === 'function' && t.closest('button,[data-nodrag]')) return
        dragWin.current = { dx: ev.clientX - pos.x, dy: ev.clientY - pos.y }
        if (ev && ev.currentTarget && typeof ev.currentTarget.setPointerCapture === 'function' && ev.pointerId !== undefined) {
          try { ev.currentTarget.setPointerCapture(ev.pointerId) } catch (err) {}
        }
      }
      const onTitleMove = (ev) => {
        if (!dragWin.current) return
        setPos(clampPos(ev.clientX - dragWin.current.dx, ev.clientY - dragWin.current.dy))
      }
      const onTitleUp = () => {
        if (!dragWin.current) return
        dragWin.current = null
        setPos((cur) => {
          const fixed = clampPos(cur.x, cur.y)
          try { posStore.write(fixed) } catch (err) {}
          return fixed
        })
      }
      const onTitleDouble = () => {
        const dp = defaultPos()
        setPos(dp)
        try { posStore.write(dp) } catch (err) {}
      }

      // 关掉窗口就整个不渲染（和八球一致；DOM 网格没有 rAF，不需要额外的停帧逻辑）
      if (!s.mineOpen) return null

      const face = faceOf(s.scheme)
      const btnStyle = {
        border: '1px solid ' + IM_EDGE, background: 'linear-gradient(#ffffff,#e6eef8)', color: '#1a1a1a',
        font: '11px/1.5 SimSun, serif', padding: '2px 8px', cursor: 'pointer', pointerEvents: 'auto',
      }
      const bar = { border: '1px solid ' + IM_EDGE, background: '#ffffff', boxShadow: bevel(face, IM_EDGE) }
      const rows = []
      rows.push(h('div', {
        key: 'title',
        onPointerDown: onTitleDown, onPointerMove: onTitleMove, onPointerUp: onTitleUp,
        onDoubleClick: onTitleDouble,
        title: '拖动移动；双击回到默认位置（窗口只能留在应用窗口内 —— 浮层出不去）',
        style: {
          display: 'flex', alignItems: 'center', gap: 6, padding: '0 4px 0 7px', cursor: 'move',
          height: MINE_VIEW.titleH, boxSizing: 'border-box', overflow: 'hidden',
          background: IM_BLUE, color: '#ffffff', font: 'bold 12px/1.6 SimSun, serif',
          borderTopLeftRadius: 3, borderTopRightRadius: 3,
          pointerEvents: 'auto',
        },
      }, [
        h('span', { key: 't', style: { flex: '1 1 auto' } }, '扫雷'),
        s.poolHint
          ? h('span', {
            key: 'hint',
            'data-nodrag': '1',
            title: 'AI 回复完成了 —— 窗口不动，你自己决定什么时候看',
            onClick: () => store.set({ poolHint: '' }),
            style: { cursor: 'pointer', color: '#ffe14d', fontSize: 11, pointerEvents: 'auto' },
          }, s.poolHint + ' ✕')
          : null,
        h('button', {
          key: 'min', type: 'button', title: min ? '还原扫雷' : '收起成一条标题栏（局面保留）',
          onClick: () => { try { save.write(eng.serialize()) } catch (err) {}; setMin(!min) },
          style: { ...btnStyle, background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.45)', padding: '0 6px' },
        }, min ? '▣' : '─'),
        h('button', {
          key: 'x', type: 'button', title: '关闭扫雷（先存盘，下次点「扫雷」可继续）',
          onClick: () => { try { save.write(eng.serialize()) } catch (err) {}; store.set({ mineOpen: false, poolHint: '' }) },
          style: { ...btnStyle, background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.45)', padding: '0 6px' },
        }, '✕'),
      ]))

      if (!min) {
        rows.push(h('div', {
          key: 'hud',
          className: 'dsh-skin-im2005-mine-hud',
          style: {
            display: 'flex', gap: 6, alignItems: 'center', padding: '0 7px',
            background: '#eef3fb', borderBottom: '1px solid ' + IM_EDGE,
            font: '11px/1.5 SimSun, serif', color: '#1a1a1a',
            height: MINE_VIEW.hudH, boxSizing: 'border-box', flexWrap: 'nowrap',
            whiteSpace: 'nowrap', overflow: 'hidden',
          },
        }, [
          h('span', { key: 'left', style: { flex: '1 1 auto', minWidth: 0, overflow: 'hidden', display: 'flex', gap: 8, alignItems: 'center' } }, [
            h('span', { key: 'lv', style: { fontWeight: 'bold', color: IM_BLUE_DEEP } }, '雷 ' + hud.mines + ' · 旗 ' + hud.flags),
            h('span', { key: 't', style: { overflow: 'hidden', textOverflow: 'ellipsis' } }, '时间 ' + hud.elapsed + 's'),
            h('span', { key: 'best', style: { overflow: 'hidden', textOverflow: 'ellipsis' } },
              '最佳 ' + (best.current[hud.level] === null || best.current[hud.level] === undefined ? '—' : best.current[hud.level] + 's')),
          ]),
          h('button', {
            key: 'dlv', type: 'button', style: { ...btnStyle, flexShrink: 0 },
            title: '切换难度（简单 50 / 普通 80 / 困难 120 雷），会把当前这局重开',
            onClick: switchLevel,
          }, '难度：' + (MINE.LABELS[hud.level] || MINE.LABELS.normal)),
          h('button', {
            key: 'new', type: 'button', style: { ...btnStyle, flexShrink: 0 },
            title: '重开一局（当前进度丢弃）',
            onClick: () => restart(),
          }, '重开'),
          h('button', {
            key: 'sfx', type: 'button', style: { ...btnStyle, flexShrink: 0 },
            title: '扫雷音效（翻开 / 插旗 / 踩雷 / 扫完，全部现场合成）',
            onClick: () => { try { if (store.setPoolSfx) store.setPoolSfx(s.poolSfx === false) } catch (err) {} },
          }, '音效：' + (s.poolSfx === false ? '关' : '开')),
        ]))
      }

      if (!min) {
        const cells = []
        for (let i = 0; i < MINE_SIZE; i++) {
          const c = hud.cells ? hud.cells[i] : null
          const isOpen = c ? c.open : false
          const isFlag = c ? c.flag : false
          const isMine = c ? c.mine : false
          const isBoom = c ? c.boom : false
          let label = ''
          let color = '#000000'
          let bg = '#c0c0c0'
          if (isOpen && isMine) { label = '●'; color = '#ffffff'; bg = isBoom ? '#ff0000' : '#808080' }
          else if (isOpen && c && c.n > 0) { label = String(c.n); color = MINE_NUM_COLOR[c.n] || '#000000' }
          else if (!isOpen && isFlag) { label = '⚑'; color = '#c0392b' }
          cells.push(h('div', {
            key: 'c' + i,
            className: 'dsh-skin-im2005-mine-cell',
            'data-i': i,
            onClick: onCell(i),
            onContextMenu: onCellFlag(i),
            onDoubleClick: onCellChord(i),
            onMouseDown: onCellMidDown,
            onAuxClick: onCellMid(i),
            style: {
              width: MINE_VIEW.cell, height: MINE_VIEW.cell, boxSizing: 'border-box',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              font: 'bold 13px/1 Tahoma, SimSun, serif', userSelect: 'none',
              background: bg,
              borderTop: '2px solid ' + (isOpen ? '#808080' : '#ffffff'),
              borderLeft: '2px solid ' + (isOpen ? '#808080' : '#ffffff'),
              borderRight: '2px solid ' + (isOpen ? '#ffffff' : '#808080'),
              borderBottom: '2px solid ' + (isOpen ? '#ffffff' : '#808080'),
              color, cursor: isOpen ? 'default' : 'pointer', pointerEvents: 'auto',
            },
          }, label))
        }
        rows.push(h('div', {
          key: 'grid',
          style: {
            padding: MINE_VIEW.pad, background: '#c0c0c0',
            display: 'grid',
            gridTemplateColumns: 'repeat(' + MINE.W + ', ' + MINE_VIEW.cell + 'px)',
            pointerEvents: 'none',
          },
        }, cells))
      }

      if (!min) {
        rows.push(h('div', {
          key: 'tip',
          className: 'dsh-skin-im2005-mine-tip',
          style: {
            padding: '3px 7px 5px', background: '#eef3fb', font: '11px/1.6 SimSun, serif',
            color: '#333', borderTop: '1px solid ' + IM_EDGE,
            height: MINE_VIEW.tipH, boxSizing: 'border-box', overflow: 'hidden',
          },
        }, hud.state === 'lost'
          ? '踩雷了 —— 点「重开」再来一局'
          : hud.state === 'won'
            ? '扫完了！用时 ' + hud.elapsed + ' 秒' + (newBest ? '（新纪录）' : '')
            : (boot.current.resumed && hud.opened === 0
              ? '接着上次的一局：左键翻开、右键插旗、双击数字连开'
              : '左键翻开 · 右键插旗 · 数字点一下就连开（双击/中键也行）')))
      }

      return h('div', {
        className: 'dsh-skin-im2005-mine',
        style: {
          position: 'fixed', left: pos.x, top: pos.y, width: winW,
          background: face, border: '1px solid ' + IM_EDGE_STRONG, boxShadow: '2px 3px 10px rgba(0,0,0,0.35)',
          zIndex: POOL_VIEW.z, pointerEvents: 'none', borderRadius: 4,
        },
      }, rows)
    }
    /* GAME-MINE-VIEW:END */


    const ImShowColumn = () => {
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
      // 昵称编辑：抬头是 CSS 伪元素、点不到，所以编辑入口放在 个人空间 里这一行
      const [nickEditing, setNickEditing] = React.useState(false)
      const [nickDraft, setNickDraft] = React.useState('')
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
        h(ImSection, {
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
        h(ImSection, {
          key: 'zone', title: '个人空间', open: sec.zone, onToggle: () => flip('zone'),
          // 只有展开时才吃剩余高度；收起时回到自适应高度，
          // 否则收起来会留一大块空白、把「我的形象」顶不上去。
          style: sec.zone
            ? { flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column' }
            : { flex: '0 0 auto' },
          bodyStyle: { flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column' },
        }, [
          // 账户身份（getProfile）—— 登录身份，只作展示
          h('div', {
            key: 'who',
            title: [s.accountName, s.accountContact].filter(Boolean).join(' · '),
            style: {
              marginBottom: 2, color: '#6b7280',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            },
          }, '账号：' + (s.accountName || s.accountContact || '未登录')),
          // 我的昵称 = 聊天抬头里的**绿名**。
          // 抬头是 CSS 伪元素（点不到），所以编辑入口放在这里。
          nickEditing
            ? h('input', {
              key: 'nicked',
              autoFocus: true,
              value: nickDraft,
              maxLength: 20,
              placeholder: '聊天里显示的名字，留空 = 我',
              onChange: (e) => setNickDraft(e.target.value),
              onKeyDown: (e) => {
                if (e.key === 'Enter') {
                  try { if (s.setNickname) s.setNickname(e.target && e.target.value) } catch (err) {}
                  setNickEditing(false)
                } else if (e.key === 'Escape') setNickEditing(false)
              },
              onBlur: () => setNickEditing(false),
              style: {
                width: '100%', boxSizing: 'border-box', marginBottom: 4,
                border: '1px solid ' + IM_EDGE, background: '#ffffff', color: '#1a1a1a',
                font: '11px/1.4 "SimSun","宋体",sans-serif', padding: '1px 3px',
                // ⚠️ 整列的容器是 pointer-events:none，每个可交互控件都必须自己打开，
                //    否则点了没反应（这个坑踩过一次）
                pointerEvents: 'auto',
              },
            })
            : h('div', {
              key: 'nick',
              title: '点击编辑聊天里显示的昵称（回车保存，Esc 取消）',
              onClick: () => { setNickDraft(s.nickname || DEFAULT_NICK); setNickEditing(true) },
              style: {
                marginBottom: 4, padding: '1px 3px', cursor: 'text',
                color: '#1a7a1a', fontWeight: 'bold',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                // ⚠️ 同上：容器 pointer-events:none，这一行必须自己打开才点得到
                pointerEvents: 'auto',
              },
            }, '昵称：' + (s.nickname || DEFAULT_NICK) + '　✎'),
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
        h(ImSection, {
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

        // ---- 聊天抬头显示的昵称（绿名）----
        // 空值回落「我」；长度限 20，避免把抬头撑变形。
        store.setNickname = (v) => {
          const n = String(v == null ? '' : v).slice(0, 20).trim() || DEFAULT_NICK
          store.set({ nickname: n })
          writeNickname(n)
        }

        // 美式八球的对手 / 难度 / 音效偏好读盘（默认"跟电脑打、普通难度"）
        store.set({ poolVs: readPoolVs(), poolCpu: readPoolLevel(), poolSfx: readPoolSfx() })
        store.setPoolVs = (v) => { const x = v === 'human' ? 'human' : 'cpu'; store.set({ poolVs: x }); writePoolVs(x) }
        store.setPoolLevel = (v) => { const x = ['easy', 'normal', 'hard'].indexOf(v) >= 0 ? v : 'normal'; store.set({ poolCpu: x }); writePoolLevel(x) }
        store.setPoolSfx = (on) => { const x = !!on; store.set({ poolSfx: x }); writePoolSfx(x) }
        // 扫雷的难度偏好
        store.set({ mineLevel: readMineLevel() })
        // 备注框：开关也读盘 —— 上次开着就还开着
        store.set({ noteOpen: readNoteOpen() })
        store.set({ farmOpen: readFarmOpen(), farmSfx: readFarmSfx() })
        store.setFarmSfx = (on) => {
          const x = on === true
          store.set({ farmSfx: x })
          writeFarmSfx(x)
        }
        store.setMineLevel = (lv) => {
          const x = MINE.MINES[lv] ? lv : 'normal'
          store.set({ mineLevel: x })
          writeMineLevel(x)
        }

        

        

        

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
        /**
         * 农场用：读一次余额总量（元）。故意**不做轮询** —— 本机内存/电池都紧，
         * 只在打开农场窗口（或用户点 ↻）时取一次，和上次游标作差。
         * 失败返回 null，农场自动降级为"轮次 + 时间"驱动。
         */
        store.farmBalance = async () => {
          try {
            const api = ctx.remote && ctx.remote.account
            if (!api || typeof api.getBalance !== 'function') return null
            let loc = ''
            try { loc = ctx.locale.getSnapshot().active } catch (err) {}
            const result = await api.getBalance(accountMetadata(loc))
            if (!result || result.ok !== true) return null
            const value = result.value
            if (!value || value.status !== 'ready') return null
            const wallets = Array.isArray(value.value) ? value.value : []
            const bonus = Array.isArray(value.bonusWallets) ? value.bonusWallets : []
            let total = 0
            let any = false
            for (const w of wallets.concat(bonus)) {
              const n = Number(String((w && w.balance) == null ? '' : w.balance).replace(/,/g, ''))
              if (Number.isFinite(n)) { total += n; any = true }
            }
            return any ? total : null
          } catch (err) { return null }
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

        /* GAME-HINT:BEGIN */
        // ---- 「任务完成」时给球桌闪一行提示（3b：只在标题栏闪，不动窗口、不抢焦点）----
        //
        // 为什么不复用提醒功能那个观察器：提醒功能在公开版被**整块剥离**，而这个游戏
        // 两个版本都带 —— 复用会让公开版直接报未定义。所以这里自带一个**极简**观察器：
        // 只在"运行中 → 不运行"的那一刻闪一下。不判时长、不判冷却、不按会话记账，
        // 因为提示误闪一下无害（和"声音误响"完全不是一个量级）。
        ctx.effect(() => {
          if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return () => {}
          let wasRunning = false
          let queued = false
          const sample = () => {
            queued = false
            let running = false
            try { running = document.querySelector('[data-chat-running]') !== null } catch (err) { return }
            if (wasRunning && !running) {
              // 农场的"完成轮次"驱动：和闪提示共用同一个信号（不另开观察器），内部自带节流
              try { farmOnTurn() } catch (err) {}
              if (store.poolOpen) store.set({ poolHint: '任务完成 · 回来看 →' })
            }
            wasRunning = running
          }
          const schedule = () => { if (queued) return; queued = true; setTimeout(sample, 16) }
          const mo = new MutationObserver(schedule)
          try {
            mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-chat-running'] })
          } catch (err) {
            console.warn('[dsh-skin-im2005] 美式八球任务提示观察器启动失败', err)
            return () => {}
          }
          sample()
          return () => { try { mo.disconnect() } catch (err) {} }
        })
        /* GAME-HINT:END */

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
          ['conversation.composer.dock', 'im2005-skin-control', ImSkinControl],
          ['shell.overlay', 'im2005-show', ImShowColumn],
          ['shell.overlay', 'im2005-strip', ImStripChrome],
          ['sidebar.footer.action', 'im2005-footer', ImFooterStatus],
          // list slot on the session header: IM window controls (─ 档位 ✕)
          ['conversation.session.header.actions', 'im2005-header-actions', ImHeaderActions],
          // list slot beside the input: 余额 / 形象秀固定 工具条（浅蓝底）
          ['conversation.input.dock', 'im2005-toolbar', ImToolBar],
          // ⚠️ 绝不能注册进 sidebar.panellist！它虽然 kind=list，但它是「主面板注册表」：
          // 往里注册的东西会被布局当成可切换面板，随后抛
          //   layout.selectPanel: main panel "im2005-profile" is not registered
          // 未捕获异常 → 整个客户端插件激活失败 → 应用起不来（真崩过两次）。
          //
          // 侧栏没有任何可放内容的 list 槽，所以卡片走 shell.overlay 浮层，
          // 由 CHROME_CSS 的 padding-top 把侧栏内容整体下推，视觉上"插"在工作区标题行之上。
          ['shell.overlay', 'im2005-profile', ImProfileCard],
          // list slot: 余额弹窗
          ['shell.overlay', 'im2005-balance', ImBalanceDialog],
          // 美式八球窗口（浮层）。引擎/存档通过 inject 交给界面 —— 也让回归测试拿到同一条路径。
          // Token农场（浮层）。引擎/存档/位置/开关走 inject；余额取数走 store.farmBalance。
          ['shell.overlay', 'im2005-farm', ImFarmWindow, {
            inject: () => ({
              engine: { create: createFarmEngine, FARM },
              save: { read: readFarmSave, write: writeFarmSave },
              pos: { read: readFarmPos, write: writeFarmPos },
              openFlag: { read: readFarmOpen, write: writeFarmOpen },
              sfxPref: { read: readFarmSfx, write: writeFarmSfx },
              view: FARM_VIEW,
            }),
          }],
          // 跨会话备注框（浮层）。内容/位置/开关都走 inject，测试拿到同一条路径。
          ['shell.overlay', 'im2005-note', ImNoteWindow, {
            inject: () => ({
              text: { read: readNoteText, write: writeNoteText },
              pos: { read: readNotePos, write: writeNotePos },
              openFlag: { read: readNoteOpen, write: writeNoteOpen },
              view: NOTE_VIEW,
            }),
          }],
          // 扫雷窗口（浮层）。引擎/存档/最佳成绩同样走 inject，测试拿到的是同一条路径。
          ['shell.overlay', 'im2005-mine', ImMineWindow, {
            inject: () => ({
              engine: { create: createMineEngine, MINE },
              save: { read: readMineSave, write: writeMineSave, clear: clearMineSave },
              pos: { read: readMinePos, write: writeMinePos },
              level: { read: readMineLevel, write: writeMineLevel },
              best: { read: readMineBest, write: writeMineBest },
              view: MINE_VIEW,
            }),
          }],
          ['shell.overlay', 'im2005-pool', ImPoolWindow, {
            inject: () => ({
              engine: { create: createPoolEngine, POOL },
              save: { read: readPoolSave, write: writePoolSave, clear: clearPoolSave },
              pos: { read: readPoolPos, write: writePoolPos },
              view: POOL_VIEW,
              cpu: poolCpuShot,
              // 音效也露出来：回归测试要断言"开关真能静音"（和引擎走同一条注入路径）
              sfx: { set: (on) => { poolSfx.on = !!on }, clack: poolClack, rail: poolRail, pot: poolPot, cue: poolCue },
            }),
          }],
          // single slot, but we WANT to replace the host's brand mark with our
          // penguin — the message says to shadow it with a lower priority
          ['sidebar.brand.mark', 'im2005-brand', ImBrandMark, { priority: -1 }],
        ] : []
        const ok = slots.filter(([a, b, c, d]) => safe(a, b, c, d)).map((r) => r[0])
        store.set({
          diag: store.diag + (DECORATIONS ? ' · slots ' + ok.length + '/' + slots.length : ' · 装饰层已关闭'),
        })
      },
    }
  },
})
