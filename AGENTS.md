# 把 @froq/ui 嵌进当前项目

你在另一个项目里工作。用户要这个项目使用 froq 的 UI 库。按本文件做。库的仓库是 https://github.com/0froq/ui ，本文件在仓库根目录。

做完之后要同时满足这两件事：

- 当前项目的 `vendor/ui/` 里是这份库的完整源码，并且已经提交在当前项目里。依赖用 file 协议指向 `vendor/ui`。本地 dev 和远端构建都编译这次提交里的这些文件。
- 当前项目自己的 agent markdown 里写有「推送到上游」「拉取上游」和「把项目里的组件抽进库」。以后用户在这个项目里说「推到上游」「跟上 UI 上游」或「把这个组件抽进 UI 库」，只读该项目的 agent markdown 就能做。抽组件时，拿不准分层、粒度和风格要先问用户；做完要说明放在哪、props 是什么。不必再打开本文件，但写库代码时要读 `vendor/ui/AGENTS.md` 的「代码规范」。

## 禁止

- 不要 `pnpm add github:0froq/ui`，不要锁 tag，不要发 npm。
- 不要 `pnpm link`，不要 `UI_LOCAL`，不要把 `@froq/ui` alias 到本项目以外的目录。
- 不要用 git submodule。不要在 `vendor/ui` 里执行 `git init`、`git commit` 或 `git push`。
- 不要把库挪进 `packages/ui`。不要把 `vendor/ui` 写进当前项目的 `pnpm-workspace.yaml`。
- 当前项目已有的页面和组件保持不动，除非用户要你换成这个库里的组件，或要你把某个组件抽进库。

`vendor/ui` 是当前项目里的普通目录，提交记在当前项目上。

## 安装

在当前项目的根目录操作。

1. 确认这是一个 git 仓库。`git status` 必须是干净的。不干净就停下来，不要 stash。
2. `vendor/ui` 已经存在就不要再 `subtree add`。转到「已经嵌过」。
3. 把库放进项目并提交。这条命令自己会产生提交：

```bash
git subtree add --prefix=vendor/ui https://github.com/0froq/ui.git main --squash
```

仓库是公开的，用这个 https 地址，不需要 token。

4. 加上依赖。项目用 pnpm 时：

```bash
pnpm add ./vendor/ui
```

保持包管理器写进 `package.json` 的那一行。它必须是 file 协议，指向 `vendor/ui`，例如 `"@froq/ui": "file:vendor/ui"`。项目用别的包管理器时，用那个管理器的 `file:` 依赖，不要把项目改成 pnpm。

5. 当前项目是 Nuxt 时，在 `nuxt.config` 里加上 `build: { transpile: ['@froq/ui'] }`。页面要用组件时，把 `@froq/ui/style.css` 放进 `css`。没有页面要用，就不要加进全局 `css`。Vite 项目直接编译 `vendor/ui` 里的 `.vue`，不要加 alias，也不要加 `server.fs.allow`。
6. 当前项目的 eslint 如果会检查全部文件，把 `vendor/ui/**` 加进 ignore。不要用当前项目的格式规则去改库里已有的源码。
7. 按下一节，把同步和抽组件的步骤写进当前项目的 agent markdown。
8. 提交这次安装剩下的文件：`package.json`、锁文件、`nuxt.config`、eslint 配置、agent markdown。`subtree add` 已经提交过 `vendor/ui` 本身，不要把无关改动放进这次提交。

### 引用

```ts
import '@froq/ui/style.css'
import { Choice, Toggle } from '@froq/ui'
```

包名 `@froq/ui`。导出有 `.`、`./core`、`./vue`，以及 `./style.css` 和 `./tokens.css`。作用域类是 `ui`。字体不在包里。组件用 Instrument Serif、Geist、Geist Mono，由当前项目自己引入。组件放在带 `class="ui"` 的元素里。

## 写进当前项目的 agent markdown

查找顺序：`AGENTS.md`、`AGENT.md`、`CLAUDE.md`。找到的第一份就是要改的文件。一份都没有就新建根目录的 `AGENTS.md`。只改这一份。

文件里已有 `<!-- froq-ui -->` 时，用下面这一整段替换从该标记到 `<!-- /froq-ui -->` 的内容（含两端标记）。没有就追加到文件末尾。

把下面围栏里的正文原样写入，不要改命令、路径和仓库地址。

用户要求抽组件、推上游或拉上游，而当前项目的 agent markdown 里还没有这一段时，先写入并提交这一段，再按其中对应的小节做。

~~~~markdown
<!-- froq-ui -->
## @froq/ui

本项目的 UI 库源码在 `vendor/ui`。这是本仓库里的普通目录，不是 submodule，目录里没有自己的 git。所有 git 命令都在本项目根目录执行，不要进入 `vendor/ui`。依赖用 file 协议指向 `vendor/ui`，包名是 `@froq/ui`。

在本项目里改 UI，就是改 `vendor/ui/src/...`。保存后本项目的 dev server 会更新。然后在本项目根目录提交并推送。本地 dev 和远端构建编译的是这次提交里的文件。这次提交不会自动进入 https://github.com/0froq/ui ，别的项目也不会变。

库的形状是：`vendor/ui/src/core/` 放不依赖框架的逻辑，`vendor/ui/src/vue/` 放无样式的 Vue 行为，组件在 `vendor/ui/src/components/`。组件只读这些变量：`--ui-bg` `--ui-fg` `--ui-muted` `--ui-faint` `--ui-line` `--ui-accent` `--ui-font-display` `--ui-font-text` `--ui-font-meta` `--ui-ease` `--ui-dur` `--ui-radius`。作用域类是 `ui`，由使用方加在外层。

### 推送到上游

用户说本项目里的 UI 有改动要推到上游、推到 ui 仓库，或同样意思的话时，按顺序做：

1. 在本项目根目录执行 `git status`。
2. `vendor/ui` 有未提交的改动时，先在本项目里提交这些改动。提交里只放 `vendor/ui`，以及这次改动必须配套的锁文件。不要把本项目其他目录的无关改动放进同一次提交。提交说明写 UI 改了什么。
3. 把本项目推到它自己的远程，使本项目远端和这次提交一致。
4. 在本项目根目录把 `vendor/ui` 送回 UI 仓库：

```bash
git subtree push --prefix=vendor/ui https://github.com/0froq/ui.git main
```

5. 成功之后，https://github.com/0froq/ui 的 `main` 包含这些改动。不打 tag，不修改别的项目。
6. 推送被拒绝时不要 force push。先完成本节「拉取上游」，解决冲突并提交，再执行一次上面的 `subtree push`。
7. 没有 `0froq/ui` 的写权限，或命令失败时，停下并说明原因。

### 拉取上游

用户说要拉取 UI 上游的最新变化、跟上 ui 仓库，或同样意思的话时，按顺序做：

1. 在本项目根目录执行 `git status`。`vendor/ui` 以外有未提交改动时停下来，告诉用户。只有 `vendor/ui` 有未提交改动时，先按「推送到上游」的第 2 步提交，然后再拉取。
2. 在本项目根目录执行：

```bash
git subtree pull --prefix=vendor/ui https://github.com/0froq/ui.git main --squash
```

3. 出现冲突时，只在 `vendor/ui` 里解决，然后 `git add vendor/ui`，完成这次合并提交。不要把仓库留在合并进行中的状态。
4. 命令成功时，这次拉取已经是本项目里的一次提交。把该提交推到本项目自己的远程。
5. `vendor/ui/package.json` 的依赖有变化时，在本项目根目录按本项目的包管理器重新安装。
6. 拉取只更新本项目的 `vendor/ui`。别的项目仍用它们自己的那一份。

### 把项目里的组件抽进库

用户指出本项目里、`vendor/ui` 以外的组件，要求抽进 UI 库、移植进 `vendor/ui`，或同样意思的话时，按这个做。`vendor/ui` 还不存在时，先安装库再抽。不要在抽组件的同时执行 `subtree push`，除非用户同时要求推到上游。

先读这个组件、它的样式、它用到的 composable，以及本项目里所有引用它的地方。分成三类：

- 交互：选择、开关、键盘、动效是否播放。
- 外观：跟库里现有组件一样，只读那十二个 `--ui-*`。对不上时先问，不要自己加另一套样式。
- 项目专属：文案、路由、i18n、某一页的数据、业务 store、只服务这一页的布局。这些留在本项目里。

不要抽这些：页面、路由、markdown 内容、整页布局。组件的核心状态如果是路由参数、业务数据或项目 store，只把交互外壳抽进库，数据留在调用处。

库里面分这几层。抽出去的东西要落在其中一层，而不是在项目里长什么样就原样搬进去：

- token：`vendor/ui/src/tokens.css`。只有颜色、字体、缓动、圆角能写进那十二个 `--ui-*` 时，才停在这一层。
- `core`：`vendor/ui/src/core/`。不引用 Vue 的逻辑。
- `vue`：`vendor/ui/src/vue/`。Vue 行为，没有样式。
- 组件：`vendor/ui/src/components/<concept>/<Name>.vue`（或 `.ts`）。同一目录是同一个概念。从 `vendor/ui/src/index.ts` 导出。

下面三件事只要有一件不能确定，就先问用户，不要动手改库。问的时候列出你看到的做法和各自的后果，然后停下等答复：

1. 它和库外的页面组件耦合在一起时：是解开耦合、只抽这一份，还是把耦在一起的几份都抽进去，还是合成一个组件。
2. 放在哪一层、抽到多细：只抽 token，抽 `core` 或 `vue` 的行为，还是抽整个组件。
3. 外观能不能只用现有的 `--ui-*`。能，就放进 `src/components`。对不上时先问，不要自己加另一套样式。

用户定了之后再改代码，让它在库里和项目里都能运行。不要把项目文件原样复制进 `vendor/ui`。指向页面组件、项目 store、路由、项目类名和项目色值的地方，改成 props、slot，或库里已有的函数；样式改读 `--ui-*`。调用处仍由项目传入文案和数据。改完后，原来的页面还要能渲染。外观如果用了 token 契约里没有的颜色或字体，而且不能改写成那十二个变量，停下来告诉用户缺哪一个，不要给这个组件单开一套变量。

写库里的代码之前，读 `vendor/ui/AGENTS.md` 的「代码规范」，并对照同一层已有文件。规范一节还没有细则时，以同一目录里已有组件为准，并让库的 eslint 通过。不要另起一套写法。

1. 定名字和 props。库里已有同一种控件就沿用现有名字，例如 `Choice`、`Toggle`。新控件不要带项目名。props 只保留交互需要的，例如 `v-model`、`options`、`label`。项目专属参数留在本项目里包一层。
2. 行为。不依赖 DOM 结构的逻辑放进 `vendor/ui/src/core/`，不要引用 Vue。需要 Vue、但不关心样子的逻辑放进 `vendor/ui/src/vue/`，并从 `vendor/ui/src/vue/index.ts` 导出。已有 `useChoice` 或其他函数能用就用，不要复制一份。有动效时用 `vendor/ui/src/core` 里的 `prefersReducedMotion`。
3. 皮肤。在 `vendor/ui/src/components/<concept>/<Name>.vue` 写模板和样式，只读那十二个 `--ui-*` 变量。不要写本项目的类名、色值或字号。组件根上不要写 `ui`，由使用方加在外层。样式加进 `vendor/ui/src/style.css`。已有概念就放进那个目录，对不上时先问，不要自己新开一个概念。
4. 从 `vendor/ui/src/index.ts` 导出该组件。共享类型从 `vendor/ui/src/vue/index.ts` 导出。
5. 在组件旁边加 `vendor/ui/src/components/<concept>/<Name>.demo.vue`，以及 `<Name>.md`（英文说明）和 `<Name>.zh.md`（中文说明）。文档站生成概念页 `/components/<concept>` 和组件页 `/components/<concept>/<name>`。概念页放这个目录里每个组件的 demo，组件页渲染旁边的说明。左侧目录有三层：form、prose 这种分组名不是页面；概念和组件都是页面。不要另写一份 demo 名单。
6. 换本项目的引用。调用处改为从 `@froq/ui` 导入，并引入 `style.css`（项目里还没有这份样式时才加）。文案和数据留在调用处。本项目里不再有旧文件的引用之后，删掉旧的组件文件。只负责使用它的页面代码留着。
7. 在本项目根目录提交。同一次提交同时包含 `vendor/ui` 的新组件和本项目换引用的改动。提交说明写抽了哪个组件。然后把本项目推到它自己的远程。不要执行 `subtree push`。

做完之后，在回复里说明下面这些，让用户审查。不要接着做别的改动：

1. 放在哪一层、哪个目录。
2. 这是 Vue 组件时，写明 props、`v-model`、插槽，并给一段在本项目里的用法。只抽了 token 或行为、没有组件时，写明新增或改动了哪些变量或函数，以及项目里怎么引用。
3. 为了解开耦合改了哪些调用，哪些东西留在本项目里。

抽完核对：

- 库组件的样式里没有本项目的类名和色值。
- 本项目通过 `@froq/ui` 使用它，不再引用旧文件。
- 改动在本项目的 git 历史里，还没有进入 https://github.com/0froq/ui ，除非用户另外要求推到上游。
<!-- /froq-ui -->
~~~~

## 代码规范

抽进库的代码要符合这一节。移植前先读这里，再对照同一层已有文件。

eslint 使用 `@antfu/eslint-config`。Vue 单行和多行都是每个属性单独一行。改完在库仓库里跑 `pnpm lint`，或在项目里对 `vendor/ui` 跑同一套配置。不要为了迁就项目原来的格式去关规则。

### 细则

维护者把具体写法写在这里。这一节还没有细则时，以同一目录里已有组件为准。

## 已经嵌过

不要再执行 `subtree add`。确认依赖仍用 file 协议指向 `vendor/ui`。如果还是 git 地址、tag 或 `link:`，改成 file 协议并更新锁文件。然后按上一节把同步和抽组件的步骤写进或更新到当前项目的 agent markdown，并提交这次改动。

## 在当前项目里改库

改 `vendor/ui/src/...`，在当前项目根目录提交并推送。不要主动执行 `subtree push`，除非用户明确要求推到上游。用户这么要求时，按该项目 agent markdown 里「推送到上游」做。用户要求把项目里的组件抽进库时，按该项目 agent markdown 里「把项目里的组件抽进库」做。

## 核对

- `vendor/ui/package.json` 的 `name` 是 `@froq/ui`。
- 当前项目的依赖用 file 协议指向 `vendor/ui`。
- `vendor/ui` 已经出现在当前项目的 git 历史里。
- 没有 `.gitmodules` 记录这份库。
- 配置里没有 `UI_LOCAL`。
- 当前项目的 agent markdown 含有 `<!-- froq-ui -->`，其中有 `git subtree push --prefix=vendor/ui https://github.com/0froq/ui.git main`、`git subtree pull --prefix=vendor/ui https://github.com/0froq/ui.git main --squash`，以及「把项目里的组件抽进库」。
- `git -C vendor/ui status` 会失败，因为那里不是一个 git 仓库。
