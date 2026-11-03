<template>
  <NuxtLink class="cta">
    <slot />
  </NuxtLink>
</template>

<style scoped>
.cta {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  white-space: nowrap;
}

.cta::after {
  content: '→';
  transition: translate 0.4s var(--ui-ease);
}

.cta:hover::after {
  translate: 4px 0;
}

.cta::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -4px;
  height: 1px;
  background: currentcolor;
  transform-origin: right;
  transform: scaleX(0.999);
  transition: transform 0.6s var(--ui-ease);
}

.cta:hover::before {
  transform-origin: left;
  animation: cta-underline 0.8s var(--ui-ease);
}

@keyframes cta-underline {
  0% {
    transform: scaleX(1);
    transform-origin: right;
  }

  45% {
    transform: scaleX(0);
    transform-origin: right;
  }

  46% {
    transform: scaleX(0);
    transform-origin: left;
  }

  100% {
    transform: scaleX(1);
    transform-origin: left;
  }
}
</style>
