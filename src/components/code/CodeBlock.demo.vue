<script setup lang="ts">
import CodeBlock from './CodeBlock.vue'

const source = 'print("hello")'
</script>

<template>
  <div class="demo-stack">
    <CodeBlock
      label="hello.lua"
      :code="source"
      copy-label="Copy"
      copied-label="Copied"
      copy-error-label="Copy failed"
    />
    <CodeBlock
      :code="source"
      copy-label="Copy"
      copied-label="Copied"
      copy-error-label="Copy failed"
    />
    <CodeBlock
      collapsible
      label="notes.txt"
      code="A collapsible frame starts closed. The corner stays available."
      copy-label="Copy"
      copied-label="Copied"
      copy-error-label="Copy failed"
    />
    <CodeBlock label="terminal">
      <template #action>
        <a href="#terminal-colors">Color data</a>
      </template>
      <pre class="ui-code-block-pre"><code>$ lua hello.lua</code></pre>
    </CodeBlock>
  </div>
</template>
