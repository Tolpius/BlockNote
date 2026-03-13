import { create } from "zustand";

export type Page = {
  id: string;
  title: string;
};

export type Block = {
  id: string;
  pageId: string;
  type: "text";
  content: string;
  order: number;
};

interface PagesStore {
  pages: Page[];
  addPage: (title?: string) => void;
  deletePage: (id: string) => void;
  updatePage: (id: string, title: string) => void;
  blocks: Block[];
  addBlock: (pageId: string) => void;
  updateBlock: (blockId: string, content: string) => void;
  deleteBlock: (blockId: string) => void;
  getPageBlocks: (pageId: string) => Block[];
}

let idCounter = 0;
function generateId(): string {
  return `item_${Date.now()}_${++idCounter}`;
}

const initialPages: Page[] = [
  { id: generateId(), title: "Meeting Notes" },
  { id: generateId(), title: "Ideas" },
  { id: generateId(), title: "Shopping List" },
];

export const usePagesStore = create<PagesStore>((set, get) => ({
  pages: initialPages,
  addPage: (title = "Untitled") =>
    set((state) => ({
      pages: [...state.pages, { id: generateId(), title }],
    })),
  deletePage: (id) =>
    set((state) => ({
      pages: state.pages.filter((page) => page.id !== id),
      blocks: state.blocks.filter((block) => block.pageId !== id),
    })),
  updatePage: (id, title) =>
    set((state) => ({
      pages: state.pages.map((page) =>
        page.id === id ? { ...page, title } : page,
      ),
    })),
  blocks: [],
  addBlock: (pageId) => {
    const blocks = get().blocks;
    const pageBlocks = blocks.filter((b) => b.pageId === pageId);
    const nextOrder = pageBlocks.length;

    set((state) => ({
      blocks: [
        ...state.blocks,
        {
          id: generateId(),
          pageId,
          type: "text",
          content: "",
          order: nextOrder,
        },
      ],
    }));
  },
  updateBlock: (blockId, content) =>
    set((state) => ({
      blocks: state.blocks.map((block) =>
        block.id === blockId ? { ...block, content } : block,
      ),
    })),
  deleteBlock: (blockId) =>
    set((state) => ({
      blocks: state.blocks.filter((block) => block.id !== blockId),
    })),
  getPageBlocks: (pageId) => {
    const blocks = get().blocks;
    return blocks
      .filter((b) => b.pageId === pageId)
      .sort((a, b) => a.order - b.order);
  },
}));
