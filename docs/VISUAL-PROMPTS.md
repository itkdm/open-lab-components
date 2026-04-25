# 图片公共提示词

## 用途

这份文档用于沉淀图片模块的统一生图提示词，作为后续所有教学图片的公共母提示词。

使用方式不是每次从零重写，而是：

1. 固定使用这份公共母提示词
2. 再补当前图片的知识点主题
3. 再补必须出现的核心内容、版式和学段

这样做的目的，是让整套图片资源在风格、用途和教学表达上保持一致。

## 公共母提示词

```text
中小学课堂教学信息图，面向老师备课、课件、讲义和课堂投影使用，强调知识准确、结构清晰、可直接教学使用。采用扁平化二维教育信息图风格，版式规整，信息层级明确，重点突出，避免海报化设计，避免情绪化插画，避免装饰过多。使用白色或极浅色纯净背景，保留足够留白和安全边距，适合16:9横版高清画面。中文标签规范、清晰、易读，字体端正，字号层级分明，适合投影。图中元素以示意图、流程图、结构图、对比图、知识图为主，不要人物主体，不要照片风，不要写实风，不要3D，不要复杂光影，不要纹理噪点，不要水印，不要品牌标识，不要无关背景元素。整体风格统一、干净、理性、教学导向，适合长期作为教学资源库素材。
```

## 公共反向提示词

```text
写实风，摄影感，3D渲染，海报风，游戏UI，电影感，赛博朋克，过度阴影，强透视，复杂背景，人物主体，卡通表情人物，杂乱排版，花哨装饰，低清晰度，模糊文字，错误中文，错别字，水印，logo，品牌信息，签名，边缘裁切，内容拥挤，颜色过艳，荧光色，噪点，脏污背景
```

## 推荐拼装方式

实际生成时，建议在公共母提示词后面，继续追加以下几部分：

- `主题为：<知识点名称>`
- `图像类型：知识图 / 流程图 / 对比图 / 示意图`
- `必须展示的知识点：<若干关键点>`
- `推荐版式：左右对比 / 横向流程 / 分区结构 / 中心辐射`
- `主色调：绿色 / 蓝色 / 橙色 / 青绿色`
- `适用学段：小学 / 初中 / 高中`

拼装模板：

```text
【公共母提示词】
+ 主题为：XXX
+ 图像类型：XXX
+ 必须展示的知识点：XXX、XXX、XXX
+ 推荐版式：XXX
+ 主色调：XXX
+ 适用学段：XXX
```

## 示例

```text
中小学课堂教学信息图，面向老师备课、课件、讲义和课堂投影使用，强调知识准确、结构清晰、可直接教学使用。采用扁平化二维教育信息图风格，版式规整，信息层级明确，重点突出，避免海报化设计，避免情绪化插画，避免装饰过多。使用白色或极浅色纯净背景，保留足够留白和安全边距，适合16:9横版高清画面。中文标签规范、清晰、易读，字体端正，字号层级分明，适合投影。图中元素以示意图、流程图、结构图、对比图、知识图为主，不要人物主体，不要照片风，不要写实风，不要3D，不要复杂光影，不要纹理噪点，不要水印，不要品牌标识，不要无关背景元素。整体风格统一、干净、理性、教学导向，适合长期作为教学资源库素材。
主题为：串联电路与并联电路对比
图像类型：对比知识图
必须展示的知识点：连接方式、电流路径、相互影响、一个灯泡损坏后的现象
推荐版式：左右对比
主色调：蓝绿色
适用学段：初中
```

## 图片文件放置位置

后续实际生成的图片统一放在：

```text
visuals/
```

按学科分目录：

```text
visuals/biology/
visuals/chemistry/
visuals/cs/
visuals/math/
visuals/physics/
visuals/science/
```

每张图建议至少配两类文件：

- 一个图片文件，例如 `vis.physics.series-parallel-circuit.png`
- 一个同名元数据文件，例如 `vis.physics.series-parallel-circuit.json`

示例：

```text
visuals/physics/vis.physics.series-parallel-circuit.png
visuals/physics/vis.physics.series-parallel-circuit.json
```

如果后续需要单独缩略图，也可以扩成：

```text
visuals/physics/vis.physics.series-parallel-circuit.png
visuals/physics/vis.physics.series-parallel-circuit.thumb.png
visuals/physics/vis.physics.series-parallel-circuit.json
```

## 命名建议

统一使用：

```text
vis.{subject}.{topic-slug}.png
vis.{subject}.{topic-slug}.json
```

例如：

```text
vis.physics.series-parallel-circuit.png
vis.biology.mitosis-stages.png
vis.chemistry.states-of-matter-particles.png
```
