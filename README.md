# Open Lab Components

**210+ 零依赖、即插即用的 STEM 教育交互组件库**，覆盖物理、化学、生物、数学、科学五大学科。

[![npm](https://img.shields.io/npm/v/@itkdm/open-lab-components)](https://www.npmjs.com/package/@itkdm/open-lab-components)
[![license](https://img.shields.io/github/license/itkdm/open-lab-components)](./LICENSE)

[English](./README.en.md) | 中文

![Open Lab Components 首页](./assets/home.png)

## ✨ 特性

- 🎯 **纯 HTML Fragment** — 不依赖任何框架，复制即用
- 🎨 **CSS 变量驱动** — 所有参数通过 CSS 变量配置
- 🔒 **样式隔离** — 不污染宿主环境
- 🛠️ **TypeScript 支持** — 完整类型定义
- ♿ **无障碍** — 内置 ARIA 标签

## 📦 组件概览

**210 个组件**，**44 个分类**：

| 学科 | 分类 | 示例 |
|------|------|------|
| 物理 | 电路、力学、光学、热学、波动、电磁、流体 | 抛体运动、透镜成像、示波器、卡诺循环 |
| 化学 | 器皿、反应、气体、溶液、分子模型 | 酸碱中和、理想气体定律、元素周期表 |
| 生物 | 细胞、器官、遗传、生态 | 有丝分裂、DNA 结构、循环系统 |
| 数学 | 几何、函数、微积分、统计、向量 | 函数图像、单位圆、算盘、分数圆 |
| 科学 | 地球科学、生命科学、科学工具 | 太阳系、水循环、显微镜 |

> [在线展示站](https://itkdm.github.io/open-lab-components/) — 浏览全部组件、实时调参、复制代码

## 🚀 快速开始

### npm 安装

```bash
npm install @itkdm/open-lab-components
```

```js
const lab = require('@itkdm/open-lab-components');

const all = lab.list();                                    // 全部 210 个组件
const physics = lab.list({ category: 'physics/mechanics' }); // 按分类筛选
const html = lab.readSync('phy.mechanics.projectile.interactive'); // 读取 HTML
```

### 直接使用 HTML

从 `components/` 目录复制组件文件，粘贴到你的页面中，通过 CSS 变量配置参数：

```html
<div class="cmp" data-cmp-id="phy.resistor.axial.basic"
     style="--cmp-size: 80px; --cmp-body: #caa070;">
    <!-- 组件内容 -->
</div>
```

### 本地开发

```bash
git clone https://github.com/itkdm/open-lab-components.git
cd open-lab-components && npm install
npm run dev:site      # 启动开发服务器
npm run validate      # 验证组件规范
npm run build         # 构建全部
```

## 🤝 参与贡献

欢迎提交 PR！流程：Fork → 创建分支 → 提交 → PR

详见 [贡献指南](./docs/CONTRIBUTING.md) · [组件规范](./docs/SPEC.md) · [分类规则](./docs/CATEGORY.md) · [事件协议](./docs/EVENT.md)

## 📄 许可证

[MIT](./LICENSE)

## ☕ 赞助 & 联系

这个项目由一名大三学生独立开发维护。如果对你有帮助，欢迎请我喝杯咖啡 :)

<table>
  <tr>
    <td align="center">
      <img src="./assets/wechat-pay.png" width="200" alt="微信赞赏码"><br>
      <b>微信</b>
    </td>
    <td align="center">
      <img src="./assets/alipay.png" width="200" alt="支付宝收款码"><br>
      <b>支付宝</b>
    </td>
  </tr>
</table>

微信：`17884902310`（备注 OLC） · GitHub：[@itkdm](https://github.com/itkdm)

## 🙏 致谢

- [@PastW1nd](https://github.com/PastW1nd)

---

Made by **布吉岛** · ⭐ 觉得有用就给个 Star
