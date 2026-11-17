<script lang="ts">
  import { useShell } from '../shell.svelte.ts';
  import { spineOf } from './spines.ts';

  interface Book {
    readonly title: string;
    readonly authors: readonly string[];
    readonly kind: 'book' | 'paper';
    readonly url?: string | undefined;
  }

  const shell = useShell();
  let { books }: { books: readonly Book[] } = $props();
  const kinds = { book: 'kindBook', paper: 'kindPaper' } as const;
</script>

<ul class="spines">
  {#each books as book (book.title)}
    {@const spine = spineOf(book.title, book.kind)}
    <li
      class="spine"
      class:spine--paper={book.kind === 'paper'}
      style:--spine-ink={`var(--color-${spine.role})`}
      style:--spine-height={spine.height}
      style:--spine-width={`${spine.width}`}
    >
      <svelte:element this={book.url ? 'a' : 'span'} class="spine__body" href={book.url} title={`${book.authors.join(', ')} · ${shell.t(kinds[book.kind])}`}>
        <cite class="spine__title">{book.title}</cite>
      </svelte:element>
      <span class="sr-only">{book.authors.join(', ')} · {shell.t(kinds[book.kind])}</span>
    </li>
  {/each}
</ul>
