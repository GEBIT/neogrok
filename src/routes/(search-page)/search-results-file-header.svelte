<script lang="ts">
  // FIXME extra whitespace around inline lucide icons during SSR:
  // https://github.com/lucide-icons/lucide/pull/1707#issuecomment-1894976168
  import ChevronRight from "lucide-svelte/icons/chevron-right";
  import Link from "$lib/link.svelte";
  import type { ResultFile } from "$lib/server/search-api";
  import RenderedContent from "./rendered-content.svelte";
  import { minimatch } from 'minimatch';
  
  export let file: ResultFile;
  export let rank: number;
  export let dvcsMappings: ReadonlyMap<string, string>;

  $: metadata = [
    `${file.matchCount} ${file.matchCount === 1 ? "match" : "matches"}`,
    // I don't like every result just yelling HEAD, it's not particularly useful
    // information.
    ...(file.branches.length > 1 || file.branches[0] !== "HEAD"
      ? [file.branches]
      : []),
    file.language || "Text",
    `№${rank}`,
  ];

  const getDvcsType = (
    url: URL | null
  ): string | undefined => {
    if (url) {
      for (const [hostnameGlob, hostType] of dvcsMappings.entries()) {
        if (minimatch(url.hostname, hostnameGlob)) {
          // this glob matches, use its type for link generation
          return hostType
        }
      }
    }
    return undefined
  }

  const calcTooltip = (
    fileUrl: string
  ): string => {
    let tooltip: string = "Edit in "
    let parsedFileUrl: URL | null = URL.parse(fileUrl)
    let dvcsType: string | undefined = getDvcsType(parsedFileUrl)
    if (dvcsType) {
      // capitalize first letter of dvcsType
      tooltip += dvcsType.charAt(0).toUpperCase() + dvcsType.slice(1)
    } else {
      // assume generic vcs
      tooltip += "VCS"
    }
    return tooltip
  }

  const calcEditLink = (
    file: ResultFile,
    branch: string
  ): string => {
    let editLink: string = ""
    let dvcsType: string | undefined = undefined
    if (file.fileUrl) {
      let parsedFileUrl: URL | null = URL.parse(file.fileUrl)
      if (parsedFileUrl) {
        dvcsType = getDvcsType(parsedFileUrl)
        switch (dvcsType) {
          // calculate edit link depending on dvcsType
          case 'github':
          case 'gitlab':
            // github and gitlab use the same url schema
            editLink = parsedFileUrl.protocol + '//' + parsedFileUrl.host + '/' + file.repository + '/edit/' + encodeURIComponent(branch) + '/' + encodeURIComponent(file.fileName.text)
            if (file.chunks.length > 0) {
              editLink += '#L' + file.chunks[0].startLineNumber
            }
            break
          case 'bitbucket':
            // ?mode=edit seems to work with cloud version only, not supported in server version:
            // https://community.atlassian.com/t5/Bitbucket-questions/Deeplink-to-edit-page-on-Bitbucket-Server/qaq-p/864494
            editLink = parsedFileUrl.protocol + '//' + parsedFileUrl.host + parsedFileUrl.pathname + '?mode=edit&at=' + encodeURIComponent(branch)
            if (file.chunks.length > 0) {
              editLink += '#' + file.chunks[0].startLineNumber
            }
            break
          default:
            console.log("unknown dvcsType for host: " + parsedFileUrl.hostname)
            return 'https://' + parsedFileUrl.host
        }
      }
    }
    return editLink
  };
</script>

<h2
  class="px-2 py-1 text-sm sticky top-0 flex flex-wrap bg-slate-100 whitespace-pre-wrap [overflow-wrap:anywhere]"
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
  {metadata[0]} | {#each metadata[1] as branch, i}
    {#if i > 0}, {/if}  
    {#if file.fileUrl}
    <Link to={calcEditLink(file, branch)} tooltip={calcTooltip(file.fileUrl)}>{branch}</Link>
    {:else}
    {branch}
    {/if}
  {/each} | {metadata[2]} | {metadata[3]}
</span>
</h2>
