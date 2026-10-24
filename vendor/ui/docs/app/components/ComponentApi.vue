<script setup lang="ts">
import type { ReferenceDoc } from '../composables/useComponentDocs'

defineProps<{
  doc: ReferenceDoc
}>()

const { t } = useI18n()
</script>

<template>
  <section v-if="doc.model">
    <h3>{{ t('components.model') }}</h3>
    <table class="api">
      <tbody>
        <tr>
          <th>modelValue</th>
          <td><code>{{ doc.model.type }}</code></td>
          <td>
            <span v-if="doc.model.required">{{ t('components.required') }}</span>
            <span v-else-if="doc.model.default">{{ t('components.default') }} {{ doc.model.default }}</span>
            {{ doc.model.description }}
          </td>
        </tr>
      </tbody>
    </table>
  </section>
  <section v-if="doc.props?.length">
    <h3>{{ t('components.props') }}</h3>
    <table class="api">
      <tbody>
        <tr
          v-for="prop in doc.props"
          :key="prop.name"
        >
          <th>{{ prop.name }}</th>
          <td><code>{{ prop.type }}</code></td>
          <td>
            <span v-if="prop.required">{{ t('components.required') }}</span>
            <span v-else-if="prop.default">{{ t('components.default') }} {{ prop.default }}</span>
            {{ prop.description }}
          </td>
        </tr>
      </tbody>
    </table>
  </section>
  <section v-if="doc.events?.length">
    <h3>{{ t('components.events') }}</h3>
    <table class="api">
      <tbody>
        <tr
          v-for="event in doc.events"
          :key="event.name"
        >
          <th>{{ event.name }}</th>
          <td><code>{{ event.payload }}</code></td>
          <td>{{ event.description }}</td>
        </tr>
      </tbody>
    </table>
  </section>
  <section v-if="doc.slots?.length">
    <h3>{{ t('components.slots') }}</h3>
    <table class="api">
      <tbody>
        <tr
          v-for="slot in doc.slots"
          :key="slot.name"
        >
          <th>{{ slot.name }}</th>
          <td>{{ slot.description }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped>
h3 {
  margin: 2em 0 0.5em;
  font-size: 17px;
  font-weight: 500;
}

.api {
  width: 100%;
  margin: 0 0 1.6em;
  border-collapse: collapse;
  font-size: 15px;
}

.api th,
.api td {
  padding: 10px 16px 10px 0;
  border-top: 1px solid var(--ui-line);
  vertical-align: baseline;
  text-align: left;
  font-weight: 400;
}

.api th {
  width: 8rem;
  font-family: var(--ui-font-meta);
  font-size: 13px;
}
</style>
