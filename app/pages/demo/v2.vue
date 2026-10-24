<script setup lang="ts">
import '~/assets/css/demo.css'
import '~/assets/css/demo-story.css'
import { demoStories } from '~/demo/story'

if (!import.meta.dev) throw createError({ statusCode: 404 })

useHead({ title: 'osdash · timeline review' })

const nowMs = Date.now()
const stories = demoStories(nowMs)
const active = ref(stories[0]!.id)
const story = computed(() => stories.find(item => item.id === active.value)!)

const ideas = [
  {
    id: 'spine',
    kicker: 'Idea 1',
    title: '一条主线',
    body: '所有关联的 issue 和 PR 合成一条时间线，从旧到新。每一步一行：谁、做了什么、多久前。不属于当前 PR 的步骤在行尾带上它的编号。默认只展开两样东西：让你动起来的那句话、你自己的笔记。线的末端是 Now，后面用虚线写出接下来的几步。',
    pros: '最直白，一眼就能读完。手机和桌面几乎一样。',
    cons: '关联多了以后，结构只靠行尾编号和顶部那一排 #号 表达，不够直观。',
  },
  {
    id: 'graph',
    kicker: 'Idea 2',
    title: '轨道图',
    body: '每个关联的 issue 和 PR 各占一条竖轨，像 git log 的分支图。最新的在最上面，再往上是虚线的「接下来」。PR 修 issue、新 PR 取代旧 PR 这类关系，画成两条轨之间的横线。顶部图例说明每条轨是谁。手机上轨道收窄到 12px，正文照样全宽。',
    pros: '关联结构最清楚：旧 PR 在哪断掉、新 PR 从哪接上、哪个 issue 会被关掉，都看得见。',
    cons: '要学一下怎么读，图例必不可少。超过 5 条轨会变挤。',
  },
  {
    id: 'chapters',
    kicker: 'Idea 3',
    title: '章节',
    body: '按关联项分章：每个 issue、每个 PR 一章，按出场顺序排。当前 PR 那一章展开，章末是 Now 和接下来。其他章只剩一行：状态、关系、几步、多久前。桌面左侧是目录，下面接着这个仓库的笔记。手机上目录变成顶部一排编号。',
    pros: '信息最少，结构最整齐。仓库笔记在桌面有固定位置。',
    cons: '跨章节的先后顺序被拆开了（比如第二个 issue 是什么时候关联进来的）。',
  },
] as const
</script>

<template>
  <main class="demo x-demo">
    <header class="demo-intro">
      <p class="d-kicker">osdash · timeline review · Oct 24</p>
      <h1>进行到哪一步了？</h1>
      <p class="demo-lede">
        这一版只做一件事：用一条时间线说清楚一份贡献现在<em>走到了哪一步</em>，以及它牵着哪些 issue
        和 PR。 bot、CI、label
        不再单独占行，只在失败时挂到对应那一步下面。三种思路共用同一份数据，每种都给了桌面和手机两个尺寸。
      </p>
      <div class="demo-cols">
        <section>
          <h2 class="d-label">数据：一份「故事」</h2>
          <ul>
            <li
              >关联项：当前 PR、被取代的旧 PR、要修的 issue、只是提到的 issue、别人修好它的
              PR。每项有状态和一句关系。</li
            >
            <li
              >步骤：从事件里挑出改变局面的那些，例如开、评审结论、推送、关闭、合并、关联。机器活动折进步骤里。</li
            >
            <li>Now 和接下来：Now 来自现有的回合判定，接下来按 reasonCode 套模板。</li>
          </ul>
        </section>
        <section>
          <h2 class="d-label">为后面留的位置</h2>
          <ul>
            <li
              >笔记分两种：挂在某一步上的笔记（时间线里的「Your
              note」），和整个仓库的笔记（每个设计底部或侧栏）。笔记只存在 osdash，不写 GitHub。</li
            >
            <li
              >故事是纯数据，服务端算好。网页、CLI、浏览器插件、agent 读同一个
              API。页面最底下是同一份数据的 CLI 输出。</li
            >
          </ul>
        </section>
      </div>
    </header>

    <nav
      class="demo-tabs"
      aria-label="Scenario"
    >
      <span class="d-label">场景</span>
      <button
        v-for="item in stories"
        :key="item.id"
        type="button"
        :class="{ active: item.id === active }"
        @click="active = item.id"
      >
        {{ item.tab }}
      </button>
    </nav>

    <section
      v-for="idea in ideas"
      :key="idea.id"
      class="x-idea"
    >
      <header class="x-idea-head">
        <div>
          <p class="d-kicker">{{ idea.kicker }}</p>
          <h2>{{ idea.title }}</h2>
        </div>
        <p class="x-idea-body">{{ idea.body }}</p>
        <dl class="x-idea-trade">
          <div>
            <dt>好处</dt>
            <dd>{{ idea.pros }}</dd>
          </div>
          <div>
            <dt>代价</dt>
            <dd>{{ idea.cons }}</dd>
          </div>
        </dl>
      </header>
      <div class="x-stage">
        <DemoDesktop
          :stories="stories"
          :active="active"
          @select="active = $event"
        >
          <DemoSpine
            v-if="idea.id === 'spine'"
            :story="story"
            :now-ms="nowMs"
            wide
          />
          <DemoGraph
            v-else-if="idea.id === 'graph'"
            :story="story"
            :now-ms="nowMs"
            wide
          />
          <DemoChapters
            v-else
            :story="story"
            :now-ms="nowMs"
            wide
          />
        </DemoDesktop>
        <DemoPhone>
          <DemoSpine
            v-if="idea.id === 'spine'"
            :story="story"
            :now-ms="nowMs"
          />
          <DemoGraph
            v-else-if="idea.id === 'graph'"
            :story="story"
            :now-ms="nowMs"
          />
          <DemoChapters
            v-else
            :story="story"
            :now-ms="nowMs"
          />
        </DemoPhone>
      </div>
    </section>

    <section class="x-idea">
      <header class="x-idea-head">
        <div>
          <p class="d-kicker">Appendix</p>
          <h2>同一份数据，换成 CLI</h2>
        </div>
        <p class="x-idea-body">
          三种设计的差别只在怎么画。故事模型本身就能被纯文本完整表达，所以以后的
          CLI、浏览器插件里的小面板、给 agent 的上下文都可以直接复用它，不需要再从 GitHub
          事件重新拼一遍。
        </p>
      </header>
      <DemoCli :story="story" />
    </section>

    <section class="demo-verdict">
      <p class="d-kicker">我的倾向</p>
      <h2>默认用主线，关联超过两项时换成轨道图。</h2>
      <p>
        大多数卡只有一个 PR 加一个 issue，主线足够清楚，而且最好读。真正需要结构的是「旧 PR
        被取代」「一个 PR 修多个
        issue」这类卡，轨道图正好处理它们。两者共用同一份步骤数据和同一套行样式，切换只是多画一个
        gutter。 章节适合以后做仓库笔记页，不适合放在预览里。
      </p>
    </section>
  </main>
</template>
