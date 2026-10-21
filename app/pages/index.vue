<script setup lang="ts">
import { copy } from '~/copy/zh-CN'

const inbox = useInbox()
const media = useMedia()

onMounted(() => {
  void inbox.load(false)
})
</script>

<template>
  <InboxShell :mobile="media.isMobile.value">
    <template #sidebar>
      <Sidebar
        v-if="inbox.counts.value && inbox.viewer.value"
        :counts="inbox.counts.value"
        :viewer="inbox.viewer.value"
        :pending="inbox.pending.value"
        @refresh="inbox.load(true)"
        @logout="inbox.logout()"
      />
      <MobileNav
        v-if="inbox.counts.value && inbox.viewer.value"
        :counts="inbox.counts.value"
        :viewer="inbox.viewer.value"
        :pending="inbox.pending.value"
        @refresh="inbox.load(true)"
        @logout="inbox.logout()"
      />
    </template>
    <p
      v-if="inbox.pending.value && !inbox.counts.value"
      class="inbox-status"
      >{{ copy.loading }}</p
    >
    <p
      v-if="inbox.error.value"
      class="inbox-status error"
      role="alert"
      >{{ inbox.error.value }}</p
    >
    <template v-if="inbox.counts.value && inbox.stats.value">
      <Greeting
        :name="inbox.displayName.value"
        :mine="inbox.counts.value.mine"
        :merged="inbox.stats.value.merged"
        :open="inbox.stats.value.open"
        :average-first-reply-ms="inbox.stats.value.averageFirstReplyMs"
      />
      <p
        v-if="inbox.revalidating.value"
        class="inbox-status"
        >{{ copy.updating }}</p
      >
      <p
        v-if="inbox.truncated.value"
        class="inbox-status"
        >{{ copy.truncated }}</p
      >
      <EmptyState
        v-if="!inbox.pending.value && inbox.units.value.length === 0"
        :text="copy.emptyInbox"
      />
      <template v-else>
        <Section
          :title="copy.sections.mine"
          :count="inbox.counts.value.mine"
          layout="mine"
        >
          <UnitCard
            v-for="unit in inbox.mine.value"
            :key="unit.id"
            :unit="unit"
            size="large"
          />
        </Section>
        <Section
          :title="copy.sections.activity"
          :count="inbox.counts.value.activity"
          layout="activity"
        >
          <UnitCard
            v-for="unit in inbox.activity.value"
            :key="unit.id"
            :unit="unit"
            size="row"
          />
        </Section>
        <Section
          :title="copy.sections.waiting"
          :count="inbox.counts.value.waiting"
          layout="waiting"
        >
          <UnitCard
            v-for="unit in inbox.waiting.value"
            :key="unit.id"
            :unit="unit"
            size="small"
          />
        </Section>
        <Section
          :title="copy.sections.ended"
          :count="inbox.counts.value.ended"
          layout="ended"
          collapsible
        >
          <UnitCard
            v-for="unit in inbox.ended.value"
            :key="unit.id"
            :unit="unit"
            size="small"
          />
        </Section>
      </template>
    </template>
  </InboxShell>
</template>
