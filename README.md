# osdash

froQ 的开源贡献看板。只读。生产域名是 `osdash.froq.me`。

它列出 `author:0froq -user:0froq` 的 PR 和 issue：所有还开着的，加上最近 14 天内关闭的。判断「轮到我」还是「等维护者」，缓存在 Cloudflare KV。

## 本地

需要 Node 24.21.0。开发服务器默认用样例数据，不访问 GitHub：

```sh
pnpm install
pnpm exec vp run dev
```

打开 <http://localhost:3000>。要打到 GitHub，准备 `GITHUB_TOKEN`，然后去掉页面请求里的 `mock=1`，或者设 `OSDASH_MOCK=0` 并且不要带 `mock=1`。样例只在 `nuxt dev` 生效。

## 检查

```sh
pnpm exec vp run check
pnpm exec vp run test
```

## 部署

生产用 Void，分支预览用 `cf previews deploy`。不要跑 wrangler 命令。配置怎么来的写在 `AGENTS.md`。这个仓库还没有执行过真正的 `void deploy`，KV 的 namespace id 也还没写进 `void.lock.json`。
