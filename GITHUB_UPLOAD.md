# 上传到 GitHub

本地已 `git init` 并完成首次 commit，你只需在 GitHub 建空仓库再 push。

## 方法一：网页建仓库（推荐）

1. 打开 https://github.com/new
2. Repository name：`exam-trainer`（或你喜欢的名字）
3. 选 **Public**
4. **不要**勾选 "Add a README"（本地已有）
5. 点 Create repository
6. 在终端执行（把 `YOUR_USER` 换成你的 GitHub 用户名）：

```bash
cd "/Users/liuxin/Documents/爱/github-public"
git remote add origin https://github.com/YOUR_USER/exam-trainer.git
git push -u origin main
```

## 方法二：命令行（需先登录）

```bash
gh auth login
cd "/Users/liuxin/Documents/爱/github-public"
gh repo create exam-trainer --public --source=. --remote=origin --push
```

一条命令会建仓库并推送。

## 重新生成脱敏版

```bash
cd "/Users/liuxin/Documents/爱"
node scripts/export-github-public.mjs
cd github-public
git add .
git commit -m "Update public demo export"
git push
```
