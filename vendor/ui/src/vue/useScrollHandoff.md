# useScrollHandoff

Vertical wheel and trackpad gestures belong to the inner scroll area unless a
new gesture starts at its top while scrolling up, or its bottom while scrolling
down. In that case, native scroll chaining passes the input to scrollable
ancestors. Reaching a boundary midway through an internal gesture does not pass
the rest of that gesture outward.

```ts
import { useScrollHandoff } from '@froq/ui/vue'
import { ref } from 'vue'

const content = ref<HTMLElement>()
useScrollHandoff(content, { idle: 180 })
```

Bind `content` as the scroll area's template ref. Keep `overflow-y: auto` and
`overscroll-behavior-y: contain` on that element. The composable temporarily
switches containment for wheel input and restores the original inline style
after idle, when the target changes, or when its scope is disposed.

`enabled` accepts a boolean, ref or getter. The getter runs only on client-side
wheel input, so it may read a media query. `idle` is the wheel inactivity gap in
milliseconds; direction reversal also starts a new gesture. Wheel gesture
boundaries are inferred because browsers do not expose a portable phase API.

Horizontal scrolling, pinch zoom, nested scroll areas, keyboard scrolling and
native touchscreen gestures are not intercepted. No custom animation, global
listener, page-specific selector or visual token is required.
