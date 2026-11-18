# Google One $0.00 付款弹窗一键助手 (1个月版)

登录 Google 账号后，一键直接打开 Google One `$0.00` 免费试用（**Ultra 30TB / 20TB 1个月，YouTube 附加项可选**）Google Play 付款结账弹窗（`tokenized.play.google.com/eacquire/multiline`），**只打开付款页面、不自动点击订阅扣款**，且不修改主世界 JS 原型、不触发风控登出。

## 支持方案

1. **Ultra 30TB (1个月免费)**：今天 US$0.00，1 个月 Ultra 30TB 试用。
2. **Ultra 20TB (1个月免费)**：今天 US$0.00，1 个月 Ultra 20TB 试用。

YouTube Premium 附加项由面板 / 弹窗里的 **「附带 YouTube Premium (1个月免费)」** 复选框控制：默认勾选（等同旧的 30TB/20TB + YouTube 组合），取消勾选后只下 Ultra 单订阅。开关状态存在本地，跨页/重装面板后保持。

## 安装方法（Chrome / Edge / 指纹浏览器）

1. 解压压缩包到任意本地文件夹（确保目录内直接包含 `manifest.json`）。
2. 打开 `chrome://extensions/`（或 Edge 打开 `edge://extensions/`）。
3. 开启右上角的 **开发者模式 (Developer mode)**。
4. 点击左上角 **加载已解压的扩展程序 (Load unpacked)**，选择解压后的文件夹即可。

## 使用方法

1. 登录 Google 账号后，打开 `https://one.google.com/plans`（或在任意页面点击浏览器右上角插件图标）。
2. 页面右下角会自动显示 **⚡ Google One $0.00 付款助手 (1个月版)** 悬浮面板（也可直接点右上角插件弹窗）：
   - 先按需勾选 / 取消 **附带 YouTube Premium**，再选择 **30TB** 或 **20TB** 方案点击；
   - 插件会自动触发 Google One 原生方案按钮、自动点击服务条款【同意】，并在弹窗挂载瞬间将 `eacquire` 参数重写为所选 `$0.00` 免费试用方案（同时保持 `ear[2][0] = null` 避免跨国 IP 报错），停在 Google Play 付款页面供人工核对卡片与账单明细。
3. 若需填写美国免税州资料，打开 `https://payments.google.com/gp/w/home/settings` 展开创建美国付款资料表单后点击 **🇺🇸 美区免税州资料 (OR 97201)** 即可一键填充。
