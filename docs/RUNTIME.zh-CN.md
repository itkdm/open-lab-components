# Runtime Helpers

本文档描述在既有 `v1` 组件格式之上新增的最小运行时生命周期能力。

## Public API

```js
const lab = require('@itkdm/open-lab-components');

lab.mount(html, container, props);
lab.updateProps(container, nextProps);
lab.unmount(container);
```

## 行为

- `mount(html, container, props)`
  插入组件 HTML，重新激活内联脚本，并把 `data-props` 写入挂载后的 `.cmp` 根节点
- `updateProps(container, props)`
  更新已挂载 `.cmp` 根节点上的 `data-props`。已通过 `data-props` 观测状态的组件可以继续工作
- `unmount(container)`
  执行组件注册过的清理回调，然后清空容器 DOM

## 清理注册

已迁移的交互组件可以通过挂载根节点注册清理逻辑：

```js
const registerCleanup =
  typeof root.__olcRegisterCleanup === 'function'
    ? root.__olcRegisterCleanup.bind(root)
    : null;

if (registerCleanup) {
  registerCleanup(() => {
    observer.disconnect();
    clearInterval(timer);
    cancelAnimationFrame(frameId);
  });
}
```

## 与 Registry 的对齐

如果组件 manifest 声明了 `events`，同样的 `events` 载荷会被保留到 `registry/registry.json` 中。现在推荐宿主、演示工具和检查器通过 registry 来发现事件能力，而不是直接扫描组件源码。
