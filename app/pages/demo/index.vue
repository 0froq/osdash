<script setup lang="ts">
import '~/assets/css/demo.css'
import '~/assets/css/demo-story.css'
import '~/assets/css/demo-contrib.css'
import { demoContributions } from '~/demo/contrib'

if (!import.meta.dev) throw createError({ statusCode: 404 })

useHead({ title: 'osdash · timeline review v3' })

const nowMs = Date.now()
const items = demoContributions(nowMs)
const active = ref(items[0]!.id)
const c = computed(() => items.find(item => item.id === active.value)!)

const collapsedVite = items[0]!.blocks.flatMap(block =>
  block.type === 'line'
    ? [
        [
          `${block.line.actor} ${block.line.verb}`,
          ...block.line.tags.filter(tag => tag !== 'reason'),
          ...block.line.chips,
        ].join(' · '),
      ]
    : [],
)

const ideas = [
  {
    id: 'spine' as const,
    kicker: 'Idea 1',
    title: '一条主线',
    body: '这份贡献里所有 issue 和 PR 的事件排成一条线，从旧到新，末端是 Now，再往下是虚线的接下来。不在主 PR 上的行，后面带 on #N。关联结构放在顶部的清单里：每项一行，写清楚它和主项的关系。',
    pros: '最好读。手机和桌面几乎一样。一个 issue 加一个 PR 的卡（大多数）不需要更多。',
    cons: '旧 PR 何时断、新 PR 何时接上，要靠读文字才知道。',
  },
  {
    id: 'graph' as const,
    kicker: 'Idea 2',
    title: '轨道图',
    body: '同样的行、同样的折叠，只是左边多一个 gutter：每个 issue 或 PR 一条竖线。PR 从它 close 的 issue 分出来，合并时并回去。顶部图例和 gutter 对齐，告诉你每一列是谁。',
    pros: '结构一眼可见：旧 PR 在哪里断掉、新 PR 从哪一列接上、一个 PR 连着几个 issue。',
    cons: '要先学会读。轨道超过四列，手机上会挤。',
  },
]
</script>

<template>
  <main class="demo x-demo">
    <header class="demo-intro">
      <p class="d-kicker">osdash · timeline review v3 · Oct 24</p>
      <h1>每张卡是一份贡献</h1>
      <p class="demo-lede">
        这版只留主线和轨道图。页面上每一个字都由已经抓到的字段按规则拼出来：事件类型、author_association、closingIssuesReferences、cross-reference、assignee、review
        state、check runs，加上现有的认领关键词规则和 <code>judge</code> 的
        reasonCode。不用模型。每个设计里点
        <em>Sources</em>，每一行下面会写出它来自哪个字段、为什么被保留。
      </p>
    </header>

    <section class="cv-rules">
      <div>
        <h2 class="d-label">四种原型</h2>
        <table class="cv-table">
          <thead>
            <tr>
              <th>原型</th>
              <th>卡的主项</th>
              <th>轨道</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1. 接手别人的 issue</td>
              <td>你的最新 PR</td>
              <td>它 close 的每个 issue 一条，你的旧 PR 一条，修掉它的别人的 PR 一条</td>
            </tr>
            <tr>
              <td>2. 自己报、自己修</td>
              <td>你的最新 PR</td>
              <td>同上，issue 那条是实色（你的）</td>
            </tr>
            <tr>
              <td>3. 报了，不修</td>
              <td>你的 issue</td>
              <td>一条，开着就一直延伸到 Now</td>
            </tr>
            <tr>
              <td>4. 只回应</td>
              <td>别人的 issue</td>
              <td>一条，浅色。你的评论是关键行</td>
            </tr>
          </tbody>
        </table>
        <p class="cv-note">
          两个 PR 什么时候算同一份贡献：它们 close 同一个
          issue，旧的已关闭未合并，且关闭时间不晚于新 PR 打开后 24 小时（现有的 history 规则）。新
          PR 正文里提到旧 PR，只是多一个 <em>mentions #N</em>
          标记，不是并卡的依据。两个 PR 不 close 同一个
          issue、也没有引用，就是两张卡，因为数据里没有东西把它们连起来。
        </p>
      </div>
      <div>
        <h2 class="d-label">轨道的含义</h2>
        <ul class="cv-list">
          <li>一条竖线是一个 issue 或 PR，从打开到关闭。开着的线一直延伸到 Now。</li>
          <li>PR 打开时，从它 close 的 issue 上分出一条线（横线连到那几个 issue）。</li>
          <li>PR 合并时并回 issue，issue 在同一行结束（实心绿点 + 空心绿点）。</li>
          <li>PR 关闭未合并，线在 ✕ 处断掉。下一个 PR 会复用空出来的那一列。</li>
          <li
            >只 mention、没有 closing keyword 的 issue 不占轨道，只在开 PR 那一行写
            <em>mentions #N</em>。</li
          >
          <li>实色是你的 issue / PR，浅色是别人的。</li>
        </ul>
      </div>
      <div>
        <h2 class="d-label">折叠</h2>
        <ul class="cv-list">
          <li>
            关键行永远显示：打开、关闭、合并、assign
            给你、你的认领评论（<code>isClaimComment</code>）、维护者评论（<code
              >author_association</code
            >
            是 OWNER / MEMBER / COLLABORATOR）、approve 或 request changes、主 PR 上失败的
            check、<code>judge</code> 依据的那条事件。只回应和只报告的卡，你自己的评论也是关键行。
          </li>
          <li
            >两条关键行之间的其他事件合成一行，例如
            <em>5 events · 1 comment · 2 commits · checks passed · 1 bot</em
            >。只有一条时直接显示，不折。</li
          >
          <li
            >分支只在打开、关闭、合并时变化，这三种都是关键行。所以全部收起时，分支结构和全部展开时一模一样。</li
          >
        </ul>
      </div>
    </section>

    <section class="cv-answer">
      <p class="d-kicker">关于 18820 全部收起后的样子</p>
      <h2>不是一条没有分支的线。</h2>
      <p>
        收起只藏中间的事件，不藏分支。18820 这张卡（第一个场景）全部收起后剩下这些行，轨道图里仍然有
        #18790、#18811 两条 issue 线，#18801 在 ✕ 处断掉，#18820 在同一列重新分出来并连到两个
        issue：
      </p>
      <ol class="cv-collapsed">
        <li
          v-for="line in collapsedVite"
          :key="line"
        >
          {{ line }}
        </li>
      </ol>
      <p>
        和你列的那一串比：<em>offered to fix</em> 变成 <em>You commented</em> 加一个
        <em>claim</em> 标记（关键词规则命中），原话放在下面。<em>patak 同意</em>
        无法从数据里判断，能说的是 <em>patak-dev commented</em> 加 <em>maintainer</em> 标记，以及
        timeline 里的 <em>assigned you</em>。 <em>等待合并</em> 也不对：最新的 review 是
        CHANGES_REQUESTED，所以 Now 是 <em>patak-dev requested changes</em>。
      </p>
    </section>

    <nav
      class="demo-tabs"
      aria-label="Scenario"
    >
      <span class="d-label">场景</span>
      <button
        v-for="item in items"
        :key="item.id"
        type="button"
        :class="{ active: item.id === active }"
        @click="active = item.id"
      >
        {{ item.tab }}
      </button>
    </nav>
    <p class="cv-archetype">{{ c.archetype }}</p>

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
        <DemoShell
          :items="items"
          :active="active"
          @select="active = $event"
        >
          <DemoTrack
            :c="c"
            :now-ms="nowMs"
            :mode="idea.id"
            wide
          />
        </DemoShell>
        <DemoPhone>
          <DemoTrack
            :c="c"
            :now-ms="nowMs"
            :mode="idea.id"
          />
        </DemoPhone>
      </div>
    </section>

    <section class="x-idea">
      <header class="x-idea-head">
        <div>
          <p class="d-kicker">Derivability</p>
          <h2>每段文字从哪来</h2>
        </div>
        <p class="x-idea-body">
          动词只来自事件类型，不概括意图。意图交给原话：关键行下面引用评论或 review 的前 140 字。Now
          是现有的 <code>reasonText(code, actor)</code>，接下来是按 reasonCode 查的模板表。
        </p>
      </header>
      <table class="cv-table wide">
        <thead>
          <tr>
            <th>显示</th>
            <th>来源</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>opened issue / PR #N</td>
            <td>GraphQL createdAt、author</td>
          </tr>
          <tr>
            <td>closes #N</td>
            <td>closingIssuesReferences</td>
          </tr>
          <tr>
            <td>mentions #N</td>
            <td>cross-referenced / connected，且不在 closingIssuesReferences 里</td>
          </tr>
          <tr>
            <td>commented · claim</td>
            <td>评论作者是 viewer，正文命中 <code>isClaimComment</code></td>
          </tr>
          <tr>
            <td>commented · maintainer</td>
            <td>author_association 是 OWNER / MEMBER / COLLABORATOR</td>
          </tr>
          <tr>
            <td>assigned you</td>
            <td>timeline assigned，assignee 是 viewer</td>
          </tr>
          <tr>
            <td>approved / requested changes</td>
            <td>review.state（PENDING 不算）</td>
          </tr>
          <tr>
            <td>pushed N commits / checks passed / checks failed: name</td>
            <td>timeline committed、check runs（只在折叠摘要里，失败时上关键行）</td>
          </tr>
          <tr>
            <td>merged #N · closes #M</td>
            <td>mergedAt，issue 的 closed 事件 closer 是这个 PR</td>
          </tr>
          <tr>
            <td>earlier PR, same issue</td>
            <td>history 规则（同一 issue，24 小时窗口）</td>
          </tr>
          <tr>
            <td>Now</td>
            <td><code>judge</code> → reasonCode → <code>reasonText</code></td>
          </tr>
          <tr>
            <td>接下来</td>
            <td>reasonCode 模板，例如 changes-requested → You push / reviewer reviews again</td>
          </tr>
        </tbody>
      </table>
      <p class="cv-note">
        clef
        只给你自己的账号用，而且只在规则定不下回合时出场。它在这个设计里最多多一行「依据：某句话」，写在
        Now 下面，可以没有。公开版本不需要它，上面所有行照样成立。
      </p>
    </section>

    <section class="demo-verdict">
      <p class="d-kicker">我的倾向</p>
      <h2>主线是默认。卡里有两条以上轨道时，切到轨道图。</h2>
      <p>
        原型 3、4 永远只有一条线，原型 1、2 的大多数卡是一个 issue 加一个 PR，主线就够了。只有「旧
        PR 被换掉」「一个 PR close 多个 issue」「别人的 PR 修掉了
        issue」这几种卡，轨道图才真正帮上忙。两者用同一个组件、同一份行数据，切换只是多画一个
        gutter，所以可以按轨道数自动选，不用给用户一个开关。
      </p>
      <p>上一版在 <a href="/demo/v2">/demo/v2</a>。</p>
    </section>
  </main>
</template>
