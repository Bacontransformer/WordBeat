# WordBeat

英语单词匹配 + 路径塔防 Web Demo。关卡与词库存 MySQL，前端经 Express API 读取。

## 玩法

1. 选择关卡
2. 底部点选「英文词 → 释义」配对赚金币
3. 选中攻击模组，点路径旁格子部署
4. 拦住怪物到达终点「课本」

## 环境准备

1. 本地 MySQL 8（服务 `MySQL80`）
2. 复制 `.env.example` 为 `.env`，填写密码
3. 安装依赖并初始化数据库

```bash
npm install
npm --prefix server install
npm run db:init
```

词库来源：[KyleBing/english-vocabulary](https://github.com/KyleBing/english-vocabulary)（初中 / 四级 / 高中 JSON）。

## 本地运行

开两个终端：

```bash
npm run server
npm run dev
```

- 前端：http://localhost:5173/
- API：http://localhost:3001/api/health

## 当前内容

- 6 个关卡（弯曲路径，难度递增）
- 词包：初中基础、大学四级、高中进阶（从开源词库导入）
- 3 种怪物 / 3 种模组
- 首页为错题本主题品牌页，关卡以章节列表呈现
