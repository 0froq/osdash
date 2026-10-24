<script setup lang="ts">
import CopyButton from '../button/CopyButton.vue'
import CodeBlock from './CodeBlock.vue'

const source = 'print("hello")'
</script>

<template>
  <div class="demo-stack">
    <CodeBlock
      label="hello.lua"
      :code="source"
    >
      <template #action>
        <CopyButton
          :text="source"
          label="Copy"
          copied-label="Copied"
          error-label="Copy failed"
        />
      </template>
    </CodeBlock>
    <CodeBlock :code="source">
      <template #action>
        <CopyButton
          :text="source"
          label="Copy"
          copied-label="Copied"
          error-label="Copy failed"
        />
      </template>
    </CodeBlock>
    <CodeBlock
      collapsible
      label="notes.txt"
      code="A collapsible frame starts closed. The corner stays available."
    >
      <template #action>
        <CopyButton
          text="A collapsible frame starts closed. The corner stays available."
          label="Copy"
          copied-label="Copied"
          error-label="Copy failed"
        />
      </template>
    </CodeBlock>
    <CodeBlock label="terminal">
      <template #action>
        <a href="#terminal-colors">Color data</a>
      </template>
      <p class="demo-readout">
        The corner can be a link, and the body can be something other than source.
      </p>
    </CodeBlock>
  </div>
</template>

<style scoped>
.demo-stack {
  display: grid;
  gap: 16px;
}
</style>
