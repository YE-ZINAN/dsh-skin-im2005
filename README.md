# IM2005 — 2005 年代QQ聊天框风格皮肤 · DeepSeek Harness

把 **DeepSeek Harness 桌面端**换成 2005 年即时通讯软件的样子：直角窗口、1px 硬边框、宋体、蓝色渐变标题栏、好友分组式侧栏，还有一条"形象秀"右侧列。

> **这是一个非官方的第三方皮肤插件。** 与任何即时通讯厂商（包括腾讯 / QQ）**无关联、未获授权、未获赞助**。
> 插件内**不含任何第三方图片、图标、商标或字体资源** —— 全部美术为原创 SVG（详见 [NOTICE.md](NOTICE.md)）。

---

## 效果

| 部位 | 变化 |
|---|---|
| 窗口框架 | 全部直角、1px 硬边框、去掉投影柔光 |
| 顶部标题条 | 蓝色竖向渐变 + 深蓝下边线；文案 `与 DeepSeek Harness 聊天中...` |
| 字体 | 中文界面统一宋体（SimSun） |
| 左侧栏 | 头像档案卡（在线状态 + 太阳等级 + 可编辑签名）；工作区名行白底黑字；任务列表白底；行首 `▶` 折叠三角（展开变 `▼`） |
| 消息抬头 | 每条消息上方显示 `名字 时间` —— 自己绿名、AI 蓝名 |
| 输入区工具条 | `IM2005` + `余额`（查余额 / 关闭）+ `形象秀 固定` |
| 形象秀 右侧列 | 三段可折叠面板：`好友形象` / `个人空间` / `我的形象`；展开时自动让位，**不遮挡**主会话 |
| 皮肤档位 | 三档：**关 / 标准 / 浓烈**，随时切换、实时生效 |

> 📸 **截图**：把你的界面截图放到这里（`docs/screenshot.png`），推广时效果最好。

---

## 安装

### 前置
- 已安装 **DeepSeek Harness 桌面端**
- Node.js（如果要用命令行安装方式）

### 方式 A：命令行安装（推荐）

```powershell
# 1) 把本仓库放到一个固定位置（link 安装后不能删）
#    例如 D:\plugins\dsh-skin-im2005

# 2) 指向它安装（把 <DSH安装目录> 换成你自己的）
$env:DSH_HOME = "$env:USERPROFILE\.dsh"
& '<DSH安装目录>\resources\runtime\cli\bin\dsh.cmd' plugin --profile desktop `
    add 'link:D:\plugins\dsh-skin-im2005'

# 3) 完全退出并重启客户端
```

### 方式 B：手工放置

1. 把整个文件夹放到 `<DSH_HOME>\profiles\desktop\node_modules\dsh-skin-im2005`
2. 编辑 `<DSH_HOME>\profiles\desktop\package.json`，在 `dsh.profile.bundles` 里加上 `"dsh-skin-im2005"`
3. 完全退出并重启客户端

> ⚠️ **注意**：命令行安装方式会**重算** `dsh.profile.bundles`，有可能挤掉你已装的其它插件条目。
> 装完请检查那个 `package.json`，必要时手工补回。

### 卸载

```powershell
& '<DSH安装目录>\resources\runtime\cli\bin\dsh.cmd' plugin --profile desktop remove dsh-skin-im2005
```

---

## 使用

| 想做什么 | 怎么做 |
|---|---|
| 切换皮肤档位 | 输入框上方工具条的 `IM2005` 按钮，或侧栏顶部工具条的循环按钮 |
| 关闭皮肤（回原生外观） | 工具条右侧的 `✕` |
| 查余额 | 工具条 `余额`（再点一次关闭弹窗） |
| 改个性签名 | 点侧栏档案卡的签名区域 → 输入 → **回车保存**（Esc 或点走 = 取消） |
| 写任务清单 / 提醒 | 展开 `形象秀` 列 → `个人空间` → 底部那块自由编辑区（**自动保存**） |
| 切浅色 / 深色 / 跟随系统 | `个人空间` → `外观` |
| 改正文字号 | `个人空间` → `字号 −/+`（10–22） |
| 固定形象秀列 | `形象秀` 列里的 `固定面板`，或工具条的 `形象秀 固定` |

**数据存在浏览器本地**（`localStorage`），不上传、不采集：

| key | 内容 |
|---|---|
| `dsh-skin-im2005.signature` | 个性签名 |
| `dsh-skin-im2005.todo` | 任务清单 |

---

## 自定义美术

插件**只带原创 SVG 兜底**，默认没有任何照片。想换成自己的图：

```powershell
# 1) 准备三张图，放进 assets/，按这个命名：
#    qqshow.jpg   形象秀立绘（人像/角色图）
#    penguin.png  小图标（方形、建议带透明通道）
#    avatar.png   头像（方形）
# 2) 内联进 client.js
node tools/embed-asset.mjs
# 3) 刷新客户端
```

**删掉 `assets/` 里任意一张图也不会坏** —— 对应位置会自动回退到内置原创 SVG，界面不会缺图。

> 请只放入**你有权使用**的图片。把别人的美术资源打包分发可能侵权，与本项目无关。

---

## 开发

```powershell
# 语法检查
node --check client.js

# 回归测试（40+ 断言：复刻宿主真实的 token 校验规则、渲染全部组件、点击所有控件）
node tools/self-test.mjs
```

### 项目结构

```
package.json          # dsh.bundle.patch + dsh.client{platform,immediately,inject}
cordis.patch.yml      # 只 insert 一行：挂载本包
index.js              # Host 半区（空实现，只为满足 bundle 契约）
client.js             # 全部视觉逻辑：主题 token + 8 条 slot 注册 + chrome CSS
locale/{zh,en}.json   # 插件卡片文案
icon.svg              # 原创图标
tools/embed-asset.mjs # 把 assets/ 里的图内联进 client.js（可选，见"自定义美术"）
tools/self-test.mjs   # 离线回归测试，不需要启动客户端
```

### 实现要点（想改代码的话）

插件只做三件事，**不读写其它插件的 DOM、不注册全局**：

1. **主题层** —— `ctx.theme.overrideTokens()` 覆盖约 42 个设计 token（圆角 / 描边 / 阴影 / 字体 / 颜色），按 `{light, dark}` 成对给。
2. **装饰层** —— 往宿主声明的 `list` 槽里注册自己的 React 组件（每一条都套了错误边界，插件渲染出错不会拖垮宿主）。
3. **chrome CSS** —— 一小段注入的 `<style>`，用**语义属性**（`[data-windows-titlebar]`、`[data-chat-flow-kind]`、`[data-clock]`、`[data-row-key]` …）和 CSS-module 局部名后缀给宿主已有元素上色。选择器匹配不上时是**无害空操作**，不可能让宿主编译或运行失败。

---

## 许可

- **代码**：[MIT](LICENSE) —— 随便用、改、分发，保留版权声明即可。
- **美术**：本项目自带的美术（`icon.svg`、内置 SVG 立绘/图标）为原创。
- **不含第三方资源**：仓库里没有 QQ秀、企鹅、表情包、字体等任何第三方素材。

## 免责声明

本项目是**独立开发的、非官方的**界面美化插件，出于对 2005 年代即时通讯软件视觉语言的**致敬性再创作**。

- 与腾讯、QQ 或任何即时通讯厂商**无任何关联**，未获其授权、赞助或认可。
- 不包含、不要求、不分发任何第三方的商标、图片、图标、字体或其它受版权保护的资源。
- 界面风格为**年代风格的通用视觉元素**（直角窗口、1px 硬边框、宋体、蓝色渐变标题栏、分组列表），并非任何特定产品的复制品。
- 若权利人认为本项目有任何不妥，请开 issue 联系，会立即处理。

## 致谢

- 宿主平台：[DeepSeek Harness](https://github.com/deepseek-ai)
- 灵感：2005 年前后的即时通讯软件界面
