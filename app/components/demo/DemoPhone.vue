<template>
  <figure class="x-phone">
    <div class="x-phone-screen">
      <div
        class="x-phone-bar"
        aria-hidden="true"
      >
        <span>9:41</span>
        <span class="x-phone-island" />
        <span>●●●</span>
      </div>
      <div class="x-phone-sheet">
        <span
          class="x-phone-grab"
          aria-hidden="true"
        />
        <slot />
      </div>
    </div>
    <figcaption>Mobile · 375</figcaption>
  </figure>
</template>
