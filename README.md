# 洞庭山泉 · 山泉弹珠台

把一滴地下 180 米的天然山泉，经源头灌装与江南山城配送，送进生活里的杯子。72 小时，压缩成一局最长 72 秒的弹珠旅行。

**直接游玩：[山泉弹珠台](https://mountain-spring-pinball.vercel.app)**

## 本地运行

需要 Node.js 22.12 或更新版本。

```bash
npm ci
npm run dev
```

打开终端打印的本地地址。项目使用 TypeScript、Vite、Canvas 2D 和 Web Audio，无运行时服务、数据库或密钥。

## 怎么玩

- 空格或「开始送水」发射；← / A、→ / D 控制左右挡板。
- 击中金色岩层机关，每次上升 60 米，累计 180 米后击中中央桶装水灌装站。
- 选择茶山、加班桌或球场路线，再进入相应的发光配送口。
- ↓ / S 切换岔路；P / Esc 暂停；掉落后有 3 次救援，点击发射继续。
- 手机直接使用下方的两个挡板按钮，支持同时按住。后台自动暂停。
- 成功后会听见根据本局碰撞音符生成的水声旋律。声音可关闭；最高分与杯子收集保存在本机。

## 验证

```bash
npm run check
npm test
npm run build
npm run preview
```

`tests/browser-smoke.js` 可通过 agent-browser 的 `eval --stdin` 在实际页面运行，使用公开按钮和键盘事件实测三种路线、结算、纪录、暂停、说明与声音切换，不修改游戏内部状态。

## Vercel 部署

```bash
npx vercel login
npx vercel --prod
```

构建命令 `npm run build`，输出目录 `dist`；配置见 `vercel.json`。每个独立验收点通过后 commit / push，部署与验收记录见下方文档。

## 项目文档

- [需求文档](docs/REQUIREMENTS.md)
- [架构文档](docs/ARCHITECTURE.md)
- [视觉与交互方案](docs/DESIGN.md)
- [验收和部署记录](docs/ACCEPTANCE.md)
- [品牌素材来源](public/brand/README.md)

使用用户授权的品牌素材；山体、村落、轨道、水滴与终点场景为程序绘制。项目为品牌互动概念作品，游戏时间为创意压缩，实际配送以服务情况为准。
