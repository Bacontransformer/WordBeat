# WordBeat

英语单词匹配 + 路径塔防。提供两套交付形态：

- **Web 版**：关卡与词库存 MySQL，通关进度也写入数据库（浏览器生成匿名 playerId）。
- **Android 离线版**：同一套玩法，词库与关卡打进 APK；通关进度存在本机 `localStorage`，暂无云同步。
- **iOS 工程**：仓库含 `ios/`，需 Mac / 云构建签名（可选）。

首页为弯曲线 **关卡地图**（丛林 / 海洋 / 天空三章），旗子标记当前进度关。

## 玩法

1. 选择关卡
2. 底部点选「英文词 → 释义」配对赚金币（点英文会发音）
3. 选中攻击模组，点路径旁格子部署
4. 拦住怪物；终点「课本」有耐久血量，漏怪会扣血而非一碰即败

## Web 版环境准备

1. 本地 MySQL 8（服务 `MySQL80`）
2. 复制 `.env.example` 为 `.env`，填写密码
3. 安装依赖并初始化数据库

```bash
npm install
npm --prefix server install
npm run db:init
```

词库来源：[KyleBing/english-vocabulary](https://github.com/KyleBing/english-vocabulary)（初中 / 四级 / 高中 JSON）。

## Web 本地运行

```bash
npm run db:fetch   # 可选：重新下载开源词库
npm run db:init    # 建表 + 导入词库 + 关卡种子
npm run dev:all    # 同时启动 API(:3001) 与 Vite(:5173)
```

或分开启动：

```bash
npm run server
npm run dev
```

- 前端：http://localhost:5173/
- API：http://localhost:3001/api/health
- 词包：http://localhost:3001/api/word-packs/cet4/words?limit=20

## Android 离线版

用 Capacitor 把同一套 React 游戏打成可安装 APK。构建时 `VITE_DATA_MODE=offline`，关卡与词库来自 [`src/data/offline/`](src/data/offline/)（由脚本从开源词库导出，无需 MySQL）。

### 前置

- Node.js（与 Web 相同）
- JDK **21**（推荐直接用 Android Studio 自带：`C:\develop\Android\jbr`）
- [Android Studio](https://developer.android.com/studio)（安装 Android SDK / Platform Tools）
  - Studio 本体示例：`C:\develop\Android`
  - SDK 常见路径：`%LOCALAPPDATA%\Android\Sdk`

### 生成 Android 工程并同步 Web 资源

```bash
npm install
npm run data:offline    # 若 src/data/offline 已有 JSON 可跳过
npm run build:android   # offline 构建 + cap sync android
npm run open:android    # 用 Android Studio 打开 android/
```

在 Android Studio 中：

1. 等待 Gradle 同步完成
2. 连接手机（开启开发者选项 USB 调试）或启动模拟器
3. Run ▶，或 **Build → Build Bundle(s) / APK(s) → Build APK(s)**

Debug APK 路径大致为：

`android/app/build/outputs/apk/debug/app-debug.apk`

把该文件拷到手机安装即可（需允许「未知来源」）。

### 命令行打 Debug APK（需已配置 SDK）

PowerShell 示例（按本机路径调整）：

```powershell
$env:JAVA_HOME = "C:\develop\Android\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
# 首次可在 android/local.properties 写：sdk.dir=C:\\Users\\你\\AppData\\Local\\Android\\Sdk

npm run build:android
cd android
.\gradlew.bat assembleDebug
```

产物：`android/app/build/outputs/apk/debug/app-debug.apk`

### 说明

- Web 默认仍走 `/api` + MySQL；只有 `--mode offline` / Android 包使用内置 JSON。
- `android/app/src/main/assets/public` 为构建产物，已 gitignore；克隆后请执行 `npm run build:android`。
- 发音依赖系统 TTS（Android 原生插件 / iOS AVSpeech）；个别机型若无声，可在系统设置里安装英文语音包。

## iOS 离线版（iPhone）

玩法、词库与 Android 相同，共用离线 JSON 与 `VITE_DATA_MODE=offline` 构建。

### 重要限制

**在 Windows 上无法直接打出可安装的 iPhone 包。** Apple 要求用 macOS 上的 Xcode 签名编译。本仓库已包含 `ios/` 工程；请在 Mac 上完成最后一步，或使用云端 Mac CI（如 GitHub Actions macOS runner / Codemagic）。

### 前置（Mac）

- macOS + 最新较新的 [Xcode](https://developer.apple.com/xcode/)（含 iOS Simulator）
- [CocoaPods](https://cocoapods.org/)：`sudo gem install cocoapods`
- Apple ID（免费账号可装到自己的 iPhone，有 7 天证书限制；上架需付费开发者账号）

### 构建与安装

在 **Mac** 上于项目根目录执行：

```bash
npm install
npm run build:ios      # offline 构建 + cap sync ios（会跑 pod install）
npm run open:ios      # 打开 Xcode 工作区
```

在 Xcode 中：

1. 选中左侧 **App** target → **Signing & Capabilities**
2. **Team** 选你的 Apple ID 团队；勾选自动签名
3. 顶部设备选真实 iPhone（先用数据线信任电脑）或模拟器
4. 点 Run ▶

真机若提示「未受信任的开发者」：iPhone **设置 → 通用 → VPN 与设备管理** → 信任该开发者。

### 发音

iOS 使用同一套 `@capacitor-community/text-to-speech`（底层 AVSpeech）。若无英文声：

**设置 → 辅助功能 → 朗读内容 → 声音**，下载 English 音色后再试。

### iOS 云构建（GitHub Actions，无需本机 Mac 编译）

可以。仓库已提供工作流 [`.github/workflows/ios-build.yml`](.github/workflows/ios-build.yml)，在 GitHub 的 macOS 机器上编译。

**但是：要装到你自己的 iPhone，仍然需要苹果签名材料。** 云端只是替你跑 Xcode，不能绕过 Apple 的签名规则。

| 情况 | 结果 |
|------|------|
| 未配置 Secrets | 工作流会做 **模拟器编译校验**，产物不能装真机 |
| 已配置证书 + 描述文件 + Team ID | 产出可下载的 **`.ipa`**，可装真机 / 上传 TestFlight |

#### 1. 你需要准备什么

1. **Apple Developer Program**（个人/公司，年费；免费 Apple ID 很难用于 CI 真机分发）
2. 在 [Apple Developer](https://developer.apple.com/account) / Xcode 中创建：
   - 分发或开发证书（导出为 `.p12`，记住密码）
   - 描述文件 Provisioning Profile（`.mobileprovision`），App ID 为 `com.wordbeat.app`，并勾选你的设备 UDID（Ad Hoc）或用于 App Store
3. 记下 **Team ID**（10 位）

#### 2. 把 Secrets 加到 GitHub 仓库

仓库 → **Settings → Secrets and variables → Actions → New repository secret**：

| Secret 名 | 内容 |
|-----------|------|
| `IOS_CERTIFICATE_BASE64` | `.p12` 文件的 base64 |
| `IOS_CERTIFICATE_PASSWORD` | 导出 p12 时设的密码 |
| `IOS_PROVISION_PROFILE_BASE64` | `.mobileprovision` 的 base64 |
| `IOS_TEAM_ID` | 苹果 Team ID |
| `IOS_KEYCHAIN_PASSWORD` | 可选，CI 临时钥匙串密码 |

在 Mac / Linux / Git Bash 里编码示例：

```bash
base64 -i Certificates.p12 | pbcopy          # → IOS_CERTIFICATE_BASE64
base64 -i WordBeat_AdHoc.mobileprovision | pbcopy  # → IOS_PROVISION_PROFILE_BASE64
```

Windows PowerShell：

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("Certificates.p12")) | Set-Clipboard
```

#### 3. 触发构建并下载

1. 打开 https://github.com/Bacontransformer/WordBeat/actions  
2. 选 **iOS Cloud Build** → **Run workflow**  
3. Signing mode 选 `ad-hoc`（自己手机）或 `app-store`（TestFlight）  
4. 跑完后在 Artifacts 下载 `wordbeat-ios-ipa`  
5. 安装方式：TestFlight、Apple Configurator、或 AltStore 等（按你的描述文件类型）

没有 Secrets 时也可以先点 Run，确认云端能编过（只会得到模拟器 zip）。

## 当前内容

- 6 个关卡（弯曲路径，难度递增）
- 词包：初中基础、大学四级、高中进阶（从开源词库导入 / 离线打包）
- 3 种怪物 / 3 种模组
- 首页为错题本主题品牌页，关卡以章节列表呈现
