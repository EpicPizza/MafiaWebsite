<script lang="ts">
  import SvelteMarkdown from "svelte-markdown";
  import {
    Heading,
    Paragraph,
    Text,
    Image,
    Link,
    Em,
    Strong,
    Codespan,
    Del,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    List,
    ListItem,
    Hr,
    Html,
    Blockquote,
    Code,
    Br,
  } from "./Renderers/index";

  interface Props {
    content: string;
  }

  let { content }: Props = $props();

  const renderers = {
    heading: Heading,
    paragraph: Paragraph,
    text: Text,
    image: Image,
    link: Link,
    em: Em,
    strong: Strong,
    codespan: Codespan,
    del: Del,
    table: Table,
    tablehead: TableHead,
    tablebody: TableBody,
    tablerow: TableRow,
    tablecell: TableCell,
    list: List,
    orderedlistitem: null,
    unorderedlistitem: null,
    listitem: ListItem,
    hr: Hr,
    html: Html,
    blockquote: Blockquote,
    code: Code,
    br: Br,
  };
</script>

<p class="my-4 leading-8">
  <SvelteMarkdown {renderers} source={content} />
</p>
