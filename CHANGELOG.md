# neogrok

## 1.1.4

### Patch Changes

- 6a18430: Upgrade shiki (syntax highlighting)
- 409d8ab: Fix text color regression in dark mode

## 1.1.3

### Patch Changes

- e38026c: Bump all tooling dependencies (svelte, vite, tailwind, eslint, etc)

## 1.1.2

### Patch Changes

- dfbbdf6: Improve URL encoding of repository URLs

## 1.1.1

### Patch Changes

- dbac62a: Improve legibility of filename match highlighting in dark mode

## 1.1.0

### Minor Changes

- a1f637f: Add dark mode (toggle using OS appearance)

## 1.0.3

### Patch Changes

- 9a1c731: Improve tabular display of missing optional repository properties
- 67a04c1: Handle breaking change in zoekt repo URL templates

## 1.0.2

### Patch Changes

- e0060d4: Fix SvelteKit CSRF errors in /api/list
- 5974e0f: Properly serve results from repositories that have no VCS metadata

## 1.0.1

### Patch Changes

- 4ef4961: Handle breaking change in ChunkMatch newlines

## 1.0.0

### Major Changes

- c8ba699: Cut 1.0! Neogrok has long been feature complete.

## 0.2.4

### Patch Changes

- 070b197: Fix jittering icons on SSR

## 0.2.3

### Patch Changes

- 2cdf4d7: Skip syntax highlighting files with long lines

## 0.2.2

### Patch Changes

- f9c0ad2: Replace timed delay for syntax highlighting with VisibilityObserver
- 928e040: Improve lucide-icons build perf

## 0.2.1

### Patch Changes

- 05cdf97: Fix ability to `npm install -g neogrok`

## 0.2.0

### Minor Changes

- 62a7326: Flip the default for OpenGrok automatic redirects to `true`
- 9a0407e: Add syntax highlighting with shikiji

## 0.1.1

### Patch Changes

- 14bd2b4: Fix query disappearing when changing repos limit on /repositories

## 0.1.0

### Minor Changes

- 33a5fe6: Enhance the repositories list page, making it more performant on instances with large numbers of repositories, and make columns sortable by clicking on their headers

### Patch Changes

- ace6aa0: Expand and enhance documentation on /about and /syntax
- 37dacde: Replicate live search optimization heuristic to the repositories page

## 0.0.4

### Patch Changes

- d0378bc: Display empty repositories table instead of nothing when there's a query error
- b4807fb: Make repositories table a bit skinnier by abbreviating git commit shas
- 9f80401: Expand `devalue` bypass to /api/list in addition to /api/search

## 0.0.3

### Patch Changes

- 6317c46: Fix page content jumping down on query error
- 43f7f96: Add a simple loading indicator to the search form
- 86751a7: Add a heuristic to reduce collateral zoekt load resulting from live search

## 0.0.2

### Patch Changes

- 5f28b9a: Initial automated release with changesets
