# Architecture Patterns

**Domain:** JSON Editor / Workbench SPA
**Researched:** 2026-04-20

## Recommended Architecture

A layered architecture with three tiers: UI Shell (layout + routing), Panel Components (feature areas), and a Worker Layer (CPU-heavy operations). State is centralized in a single Zustand store that all panels subscribe to. Heavy work (jq execution, diffing) is offloaded to Web Workers via a thin message-passing facade.

```
┌─────────────────────────────────────────────────────────────┐
│  App Shell (layout, panel visibility, keyboard shortcuts)   │
├──────────────┬──────────────┬──────────────┬───────────────┤
│ Editor Panel │ Transform    │ Compare      │ Validate      │
│ (Monaco)     │ Panel        │ Panel        │ Panel         │
├──────────────┴──────────────┴──────────────┴───────────────┤
│             Zustand Document Store                          │
│  { documents: Map<id,Doc>, activeDoc, transformResult,     │
│    diffResult, panelLayout }                               │
├─────────────────────────────────────────────────────────────┤
│             Worker Facade (message bus)                     │
├────────────┬────────────────┬────────────────────────────── │
│ jq Worker  │ Diff Worker    │ (future: format/parse worker) │
│ (WASM)     │ (jsondiffpatch)│                               │
└────────────┴────────────────┴───────────────────────────────┘
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| App Shell | Panel layout (PanelGroup/Panel), panel visibility toggles, global keyboard shortcuts | All panels (via layout config in store) |
| Editor Panel | Monaco instance, file load trigger, copy-to-clipboard, "send to compare" action | Zustand store (writes rawJson for active doc slot) |
| Transform Panel | jq expression input, visual field mapper UI, expression execution trigger, result display (read-only Monaco) | Zustand store (reads rawJson, writes transformResult); Worker Facade (sends jq job, receives result) |
| Compare Panel | Side-by-side or unified diff display; mode selector (value diff / structural diff / before-after); diff stats | Zustand store (reads two doc slots + transformResult); Worker Facade (sends diff job, receives delta) |
| Validate Panel | Syntax error display, error navigation, line-count / byte-size stats | Zustand store (reads rawJson); Monaco already provides validation — this panel aggregates markers |
| Zustand Store | Single source of truth for all document slots and derived results | Read by all panels; written by Editor and Worker Facade |
| Worker Facade | Thin async wrapper over postMessage — queues jobs, cancels stale jobs, returns typed promises | Called by Transform Panel and Compare Panel; writes results into store |
| jq Worker | Receives { expression, input } messages, runs jq-wasm, returns { result } or { error } | Worker Facade only |
| Diff Worker | Receives { left, right, mode } messages, runs jsondiffpatch, returns delta | Worker Facade only |

### Data Flow

```
User pastes / loads file
        │
        ▼
  Editor Panel
  Monaco onChange
        │
        ▼
  Store: documents[slotId].rawJson = text
        │
    ┌───┴──────────────────────────────────┐
    │                                      │
    ▼                                      ▼
Validate Panel                      Transform Panel
reads rawJson                       (user triggers run)
Monaco already shows                      │
syntax markers; panel                     ▼
aggregates and displays            Worker Facade
                               postMessage → jq Worker
                                           │
                                           ▼
                               Store: transformResult = output
                                           │
                                           ▼
                               Transform Panel re-renders
                               result in read-only Monaco
                                           │
                               (user clicks "send to compare")
                                           │
                                           ▼
                               Store: compareSlot[1] = transformResult
                                           │
                                           ▼
                               Compare Panel detects two slots filled
                               → Worker Facade → Diff Worker
                                           │
                                           ▼
                               Store: diffResult = delta
                               Compare Panel renders diff view
```

Key rules:
- Data flows in one direction: UI action → store write → panels re-render from store.
- Workers never write to store directly; Worker Facade resolves promises and dispatches store writes.
- Monaco instances are uncontrolled for typing (local state inside Monaco), but rawJson is synced to store on change with a short debounce (150 ms) to avoid excessive store updates on large pastes.

## Patterns to Follow

### Pattern 1: Document Slot Model
**What:** Treat each JSON document as a named "slot" in the store (e.g., `slot-A`, `slot-B`, `slot-transform`). Panels read from and write to slots by name. The Compare Panel always compares two named slots.
**When:** Whenever a panel needs to route JSON to another panel.
**Why:** Avoids prop drilling; any panel can send output to any slot; Compare Panel is generic over slot names.

### Pattern 2: Worker Facade with Job IDs
**What:** The Worker Facade assigns a unique job ID to each postMessage. When a newer job arrives for the same "channel" (e.g., `jq-transform`), it cancels (ignores response of) the previous job. Workers are stateless — each message is self-contained.
**Why:** Prevents stale results from a slow previous run overwriting a newer fast run. Critical when the user rapidly edits a jq expression.

```typescript
// Simplified facade pattern
class WorkerFacade {
  private currentJobId: Map<string, string> = new Map();

  async run(channel: string, payload: unknown): Promise<unknown> {
    const jobId = crypto.randomUUID();
    this.currentJobId.set(channel, jobId);
    const result = await postToWorker(this.workers[channel], { jobId, payload });
    if (this.currentJobId.get(channel) !== jobId) throw new CancelledError();
    return result;
  }
}
```

### Pattern 3: Monaco as Uncontrolled with Debounced Sync
**What:** Monaco manages its own internal buffer. An `onChange` handler debounces store writes (150 ms). On initial load or programmatic set (e.g., format action), call `editor.setValue()` directly; do not drive Monaco from store on every keystroke.
**Why:** Driving Monaco as a fully controlled component causes cursor-jump bugs and is unnecessary — Monaco's internal model is the source of truth for the raw text. The store holds a snapshotted copy for other panels.

### Pattern 4: Layout via react-resizable-panels with localStorage Persistence
**What:** Use `PanelGroup` with `autoSaveId` so the user's panel sizes survive page reload. Panel visibility (show/hide Compare, Transform, Validate) is tracked in the Zustand store and toggled from the App Shell toolbar.
**Why:** react-resizable-panels (bvaughn) handles collapsible panels, nested groups, and localStorage persistence out of the box. It is used by shadcn/ui and has wide adoption.

### Pattern 5: Lazy Load Monaco and Workers
**What:** Monaco and the WASM bundles are large. Load them lazily behind `React.lazy` / dynamic imports triggered on first render of the owning panel.
**Why:** The jq-wasm bundle is several hundred KB. Loading it eagerly delays first meaningful paint.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Storing Parsed JSON Objects in the Store
**What:** Saving `JSON.parse(rawJson)` into the store alongside `rawJson`.
**Why bad:** For MB-scale files, the parsed object can be 3-5× larger in memory than the string. Two copies in memory (string + object) plus Monaco's internal buffer means 3× the file size in RAM. Re-serializing for workers wastes time.
**Instead:** Store only `rawJson` (string). Parse inside workers where needed. Parse transiently in the main thread only for the visual field mapper — and only on demand, not reactively.

### Anti-Pattern 2: Running jq or Diff on the Main Thread
**What:** Calling jq-wasm synchronously from a React event handler or effect.
**Why bad:** A 2 MB JSON file through a complex jq filter can take 500 ms+, freezing all browser interaction.
**Instead:** Always dispatch to the Worker Facade. Show a loading spinner in the Transform/Compare panel while awaiting the result.

### Anti-Pattern 3: Re-diffing on Every Keystroke
**What:** Triggering a diff job in an `onChange` effect whenever either document slot changes.
**Why bad:** Diffing two 500 KB JSON files on every keypress will saturate the diff worker and produce a poor UX.
**Instead:** Diff is triggered explicitly (button press or leaving the editor field), or after a debounce of at least 500 ms. The job-cancellation pattern in the Worker Facade handles rapid re-triggers.

### Anti-Pattern 4: One Monolithic Monaco Instance
**What:** Sharing a single Monaco editor instance between Editor and Transform result display.
**Why bad:** Monaco instances are heavyweight. But a single instance that swaps models cannot simultaneously show two documents side by side.
**Instead:** Create one Monaco instance per visible panel. For the read-only result pane, use `readOnly: true`. Dispose instances when panels are hidden.

## Layout Approach

Recommended: **Persistent split panes, not tabs**.

Tools like this (VS Code, Postman, JetBrains) use split panes as the primary metaphor. Tabs are appropriate for switching between modes within a panel (e.g., value diff vs structural diff within the Compare Panel).

```
┌────────────────────────┬──────────────────────────────┐
│                        │  Transform Panel             │
│   Editor Panel         │  ┌────────┐ ┌─────────────┐ │
│   (Monaco, full JSON)  │  │jq expr │ │Visual mapper│ │
│                        │  └────────┘ └─────────────┘ │
│                        │  [Run ▶]                     │
│                        │  Result (read-only Monaco)   │
├────────────────────────┴──────────────────────────────┤
│  Compare Panel (collapsible)                          │
│  [Value Diff] [Structural Diff] [Before/After]        │
│  Left doc ◀──── diff visualization ────▶ Right doc    │
└───────────────────────────────────────────────────────┘
  Validate Panel: integrated as inline gutter markers
  + a collapsible error list below the editor
```

The Validate Panel is not a separate split region. Validation errors appear as Monaco gutter decorations (built-in), with a collapsible error list panel docked below the Editor Panel. This avoids wasting vertical space on a dedicated pane for information Monaco already shows.

## Scalability Considerations

| Concern | Small files (<100 KB) | MB-scale files | Notes |
|---------|----------------------|----------------|-------|
| Monaco rendering | Instantaneous | Handled via viewport virtualization | Monaco already limits recomputation to visible lines |
| JSON parse (for visual mapper) | Immediate | Must show loading state, parse in worker | `JSON.parse` of 5 MB takes ~100 ms on main thread |
| jq transform | <10 ms | 100 ms – 2 s depending on filter | Always in worker; show spinner |
| Diff computation | <50 ms | 500 ms – 5 s for deep diffs | Always in worker; debounce trigger |
| Clipboard copy | Immediate | ~100 ms for 5 MB string | Use async Clipboard API; acceptable |
| Store re-renders | Fine | rawJson string equality check prevents cascade | Don't store parsed objects |

## Suggested Build Order (Phase Dependencies)

```
1. App Shell + Layout skeleton (react-resizable-panels, panel visibility store)
   └── Required before: every other panel (they all mount inside the shell)

2. Editor Panel (Monaco integration, file load, paste, debounced store sync)
   └── Required before: all panels that read rawJson from store

3. Validate Panel (reads Monaco markers; trivial once Monaco is in place)
   └── Required before: nothing (can ship alongside Editor)

4. Worker Facade + jq Worker (Worker message bus, jq-wasm loading)
   └── Required before: Transform Panel (execution side)

5. Transform Panel — code expression path (jq input + result Monaco)
   └── Required before: before/after Compare mode (needs transformResult in store)

6. Compare Panel — value diff mode (Worker Facade + Diff Worker + jsondiffpatch)
   └── Required before: structural diff (builds on same diff infrastructure)

7. Transform Panel — visual field mapper (complex UI, builds on parsed JSON)
   └── Can be deferred; independent of Compare

8. Compare Panel — structural diff mode (additional diff algorithm/display)
   └── Builds on Compare Panel v1
```

Rationale for this order:
- The Editor Panel is the gateway for all data — nothing else can work without it.
- The Worker Facade is shared infrastructure; building it before Transform and Compare avoids retrofitting.
- The visual field mapper is the most complex UI piece and has no dependents — defer it safely.
- Structural diff is harder than value diff (requires schema inference); build value diff first to validate the diff worker pipeline.

## Sources

- Monaco editor web worker architecture: https://app.studyraid.com/en/read/15534/540352/understanding-monacos-web-worker-architecture
- Monaco viewport-limited computation (Hacker News): https://news.ycombinator.com/item?id=11940043
- jq-wasm (owenthereal): https://github.com/owenthereal/jq-wasm
- jq-web (fiatjaf): https://github.com/fiatjaf/jq-web
- WebAssembly + Web Workers preventing UI freeze: https://thenewstack.io/for-darryl-webassembly-and-web-workers/
- jsondiffpatch: https://github.com/benjamine/jsondiffpatch
- react-resizable-panels: https://github.com/bvaughn/react-resizable-panels
- Zustand vs Jotai for editor state (2025): https://makersden.io/blog/react-state-management-in-2025
- Large JSON rendering optimization in React: https://www.mbloging.com/post/optimize-large-json-data-rendering-react
