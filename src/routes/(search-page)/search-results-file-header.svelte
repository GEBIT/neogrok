<script lang="ts">
  // FIXME extra whitespace around inline lucide icons during SSR:
  // https://github.com/lucide-icons/lucide/pull/1707#issuecomment-1894976168
  import ChevronRight from "lucide-svelte/icons/chevron-right";
  import Link from "$lib/link.svelte";
  import type { ResultFile } from "$lib/server/search-api";
  import RenderedContent from "./rendered-content.svelte";

  export let file: ResultFile;
  export let rank: number;

  $: metadata = [
    `${file.matchCount} ${file.matchCount === 1 ? "match" : "matches"}`,
    file.language || "Text",
    `№${rank}`,
  ];

  const calcEditLink = (
    file: ResultFile,
    branch: string
  ): string => {
    let editLink: string = 'https://gitlab.local.gebit.de/' + file.repository + '/-/edit/' + branch + '/' + file.fileName.text
    if (file.chunks.length > 0) {
      editLink += '#L' + file.chunks[0].startLineNumber
    }
    return editLink
  };
</script>

<h2
  class="px-2 py-1 text-sm sticky top-0 flex flex-wrap bg-slate-100 dark:bg-slate-800 whitespace-pre-wrap [overflow-wrap:anywhere]"
>
  <!-- ideally we could hyperlink the repository but there is no such
       URL in search results - either we do dumb stuff to the file template URL
       or we make a separate /list API request for each repo -->
  <span
    ><span>{file.repository}</span><span
      ><ChevronRight class="inline" size={16} /></span
    >{#if file.fileUrl}<Link to={file.fileUrl}>
        <RenderedContent content={file.fileName} /></Link
      >{:else}<RenderedContent content={file.fileName} />{/if}</span
  >
  <span class="ml-auto">
  {metadata[0]} | {#each file.branches as branch, i}
    {#if i > 0}, {/if}  
    {#if file.fileUrl}
    <Link to={calcEditLink(file, branch)}>{branch}</Link>
    {:else}
    {branch}
    {/if}
  {/each} | {metadata[1]} | {metadata[2]}
</span>
</h2>
