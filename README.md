# AI Voice Reader (TrollStore Edition)

这是一个基于 React Native (Expo) 开发的本地 iOS 阅读器，支持 TXT 导入和 TTS 朗读。
专为 **TrollStore (巨魔)** 用户设计，支持通过 GitHub Actions 自动构建无签名 IPA。

## ✨ 功能特点

*   📂 **本地导入**：支持导入 `.txt` 小说文件。
*   🗣️ **TTS 朗读**：利用 iOS 原生 Siri 语音进行朗读。
*   🎨 **精美 UI**：基于 NativeWind (Tailwind CSS) 的现代化界面。
*   🚀 **云端构建**：无需 Mac，无需配置环境，直接通过 GitHub Actions 生成安装包。

## 🛠️ 如何构建 (Build IPA)

本项目内置了 GitHub Actions 工作流，可以自动构建 `.ipa` 文件。

1.  **上传代码**：
    将本项目文件夹的内容上传到你的 GitHub 仓库。
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    git branch -M main
    git remote add origin <YOUR_GITHUB_REPO_URL>
    git push -u origin main
    ```

2.  **触发构建**：
    *   在 GitHub 仓库页面，点击顶部的 **Actions** 标签。
    *   在左侧选择 **Build iOS IPA**。
    *   点击右侧的 **Run workflow** 按钮。

3.  **下载安装包**：
    *   等待构建完成（通常需要 10-15 分钟）。
    *   点进构建任务详情，在底部的 **Artifacts** 区域，下载 **app-release**。
    *   解压下载的 zip 文件，你将得到 `AiVoiceReader.ipa`。

## 📲 如何安装 (Install)

由于该 IPA 是无签名 (Unsigned/Ad-hoc) 的，**必须使用 TrollStore 安装**。

1.  将 `AiVoiceReader.ipa` 发送到你的 iPhone（通过 AirDrop、微信文件传输等）。
2.  在手机上选择“用 TrollStore 打开”或在 TrollStore 中点击“+”号选择安装。
3.  如果不使用 TrollStore，你需要使用个人证书或企业证书进行签名（使用爱思助手、Sideloadly 等工具）。

## 💻 本地开发

如果你想在本地修改代码：

1.  安装依赖：
    ```bash
    npm install
    ```

2.  启动服务器：
    ```bash
    npx expo start
    ```

3.  使用 Expo Go App (App Store 下载) 扫描二维码预览。

## 📝 注意事项

*   目前仅支持 `.txt` 格式。
*   TTS 朗读依赖于系统 TTS 引擎。
*   应用包名默认为 `com.anonymous.AiVoiceReader`，可以在 `app.json` 中修改。
