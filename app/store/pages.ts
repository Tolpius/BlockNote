import { create } from "zustand";
import * as db from "@/db/database";

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
  blocks: Block[];
  isInitialized: boolean;

  // Initialization
  initializeStore: () => Promise<void>;

  // Page operations
  addPage: (title?: string) => Promise<void>;
  deletePage: (id: string) => Promise<void>;
  updatePage: (id: string, title: string) => Promise<void>;

  // Block operations
  addBlock: (pageId: string) => Promise<void>;
  updateBlock: (blockId: string, content: string) => Promise<void>;
  deleteBlock: (blockId: string) => Promise<void>;
  getPageBlocks: (pageId: string) => Block[];
}

let idCounter = 0;
function generateId(): string {
  return `item_${Date.now()}_${++idCounter}`;
}

export const usePagesStore = create<PagesStore>((set, get) => ({
  pages: [],
  blocks: [],
  isInitialized: false,

  initializeStore: async () => {
    try {
      // Initialize database and create tables
      await db.initializeDatabase();

      // Load pages and blocks from database
      const pages = await db.getAllPages();
      const blocks = await db.getAllBlocks();

      set({
        pages,
        blocks,
        isInitialized: true,
      });
    } catch (error) {
      console.error("Failed to initialize store:", error);
      set({ isInitialized: true }); // Still mark as initialized to prevent infinite loading
    }
  },

  addPage: async (title = "Untitled") => {
    try {
      const newPage: Page = {
        id: generateId(),
        title,
      };

      // Save to database first
      await db.insertPage(newPage);

      // Update state
      set((state) => ({
        pages: [...state.pages, newPage],
      }));
    } catch (error) {
      console.error("Failed to add page:", error);
    }
  },

  deletePage: async (id) => {
    try {
      // Delete from database first
      await db.deletePage(id);

      // Update state
      set((state) => ({
        pages: state.pages.filter((page) => page.id !== id),
        blocks: state.blocks.filter((block) => block.pageId !== id),
      }));
    } catch (error) {
      console.error("Failed to delete page:", error);
    }
  },

  updatePage: async (id, title) => {
    try {
      // Update in database first
      await db.updatePageTitle(id, title);

      // Update state
      set((state) => ({
        pages: state.pages.map((page) =>
          page.id === id ? { ...page, title } : page,
        ),
      }));
    } catch (error) {
      console.error("Failed to update page:", error);
    }
  },

  addBlock: async (pageId) => {
    try {
      const blocks = get().blocks;
      const pageBlocks = blocks.filter((b) => b.pageId === pageId);
      const nextOrder = pageBlocks.length;

      const newBlock: Block = {
        id: generateId(),
        pageId,
        type: "text",
        content: "",
        order: nextOrder,
      };

      // Save to database first
      await db.insertBlock(newBlock);

      // Update state
      set((state) => ({
        blocks: [...state.blocks, newBlock],
      }));
    } catch (error) {
      console.error("Failed to add block:", error);
    }
  },

  updateBlock: async (blockId, content) => {
    try {
      // Update in database first
      await db.updateBlockContent(blockId, content);

      // Update state
      set((state) => ({
        blocks: state.blocks.map((block) =>
          block.id === blockId ? { ...block, content } : block,
        ),
      }));
    } catch (error) {
      console.error("Failed to update block:", error);
    }
  },

  deleteBlock: async (blockId) => {
    try {
      // Delete from database first
      await db.deleteBlock(blockId);

      // Update state
      set((state) => ({
        blocks: state.blocks.filter((block) => block.id !== blockId),
      }));
    } catch (error) {
      console.error("Failed to delete block:", error);
    }
  },

  getPageBlocks: (pageId) => {
    const blocks = get().blocks;
    return blocks
      .filter((b) => b.pageId === pageId)
      .sort((a, b) => a.order - b.order);
  },
}));
