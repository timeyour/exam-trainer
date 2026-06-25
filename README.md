# Exam Trainer · 在线版

多科考试复习 PWA：[GitHub 源码](https://github.com/timeyour/exam-trainer)

## 一键上线（Netlify + GitHub）

1. 登录 [Netlify](https://app.netlify.com/)
2. **Add new site** → **Import an existing project** → **GitHub**
3. 选仓库 **`timeyour/exam-trainer`**
4. 构建设置（一般自动识别 `netlify.toml`）：
   - **Build command:** `npm install`
   - **Publish directory:** `web`
   - **Functions directory:** `netlify/functions`
5. 点 **Deploy site**
6. 等 1～2 分钟，会得到网址，例如 `https://exam-trainer.netlify.app`

之后每次 `git push` 到 `main`，Netlify 会自动重新部署。

## 本地预览

```bash
npm install
npm test
python3 -m http.server 8080
```

浏览器打开 `http://localhost:8080/web/`

## 命令行部署（可选）

```bash
npm install -g netlify-cli
netlify login
bash scripts/netlify-deploy.sh
```

## 功能

- 多科总览、考试倒计时、今日任务路由
- 题眼背题 / 答案先行（看→遮→测）
- 模拟考试、错题池、学习壁垒诊断
- 可选云同步：设置里填同一个同步码，手机电脑进度一致

云同步 API：`/.netlify/functions/sync?key=你的同步码`

## 演示数据

内置 3 门示例科目、每科 6～8 道题。换成自己的题库：

1. 编辑 `shared/exam/*.json`
2. 运行 `node scripts/bundle-banks.mjs`
3. 提交并 push

## License

MIT
