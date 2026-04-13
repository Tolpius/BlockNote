import { create } from "zustand";
import * as db from "@/db/database";

export type Page = {
  id: string;
  title: string;
  parentId: string | null;
  position: number;
  lastVisited: string | null;
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
  addPage: (title?: string, parentId?: string | null) => Promise<Page | null>;
  deletePage: (id: string) => Promise<void>;
  updatePage: (id: string, title: string) => Promise<void>;
  visitPage: (id: string) => Promise<void>;
  reorderPages: (parentId: string | null, pageIds: string[]) => Promise<void>;
  reorderRootPages: (pageIds: string[]) => Promise<void>;

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

  addPage: async (title = "Untitled", parentId = null) => {
    try {
      const siblingPages = get().pages.filter(
        (page) => page.parentId === parentId,
      );
      const nextPosition =
        siblingPages.length > 0
          ? Math.max(...siblingPages.map((page) => page.position)) + 1
          : 0;

      const newPage: Page = {
        id: generateId(),
        title,
        parentId,
        position: nextPosition,
        lastVisited: null,
      };

      // Save to database first
      await db.insertPage(newPage);

      // Update state
      set((state) => ({
        pages: [...state.pages, newPage],
      }));

      return newPage;
    } catch (error) {
      console.error("Failed to add page:", error);
      return null;
    }
  },

  deletePage: async (id) => {
    try {
      const state = get();

      const gatherDescendants = (pageId: string): string[] => {
        const children = state.pages
          .filter((p) => p.parentId === pageId)
          .map((p) => p.id);

        return children.flatMap((childId) => [
          childId,
          ...gatherDescendants(childId),
        ]);
      };

      const pageIdsToDelete = [id, ...gatherDescendants(id)];

      await db.deletePages(pageIdsToDelete);

      // Update state
      set((state) => ({
        pages: state.pages.filter((page) => !pageIdsToDelete.includes(page.id)),
        blocks: state.blocks.filter(
          (block) => !pageIdsToDelete.includes(block.pageId),
        ),
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

  visitPage: async (id) => {
    try {
      const lastVisited = new Date().toISOString();

      await db.updatePageLastVisited(id, lastVisited);

      set((state) => ({
        pages: state.pages.map((page) =>
          page.id === id ? { ...page, lastVisited } : page,
        ),
      }));
    } catch (error) {
      console.error("Failed to update page visit:", error);
    }
  },

  reorderPages: async (parentId, pageIds) => {
    try {
      const state = get();
      const siblingPages = state.pages.filter(
        (page) => page.parentId === parentId,
      );
      const siblingIdSet = new Set(siblingPages.map((page) => page.id));

      // Keep only valid sibling IDs and append missing ones to avoid accidental loss.
      const normalizedIds = pageIds.filter((id) => siblingIdSet.has(id));
      for (const page of siblingPages) {
        if (!normalizedIds.includes(page.id)) {
          normalizedIds.push(page.id);
        }
      }

      const positionById = new Map<string, number>();
      normalizedIds.forEach((id, index) => {
        positionById.set(id, index);
      });

      const updates = normalizedIds.map((id, index) => ({
        id,
        position: index,
      }));

      set((currentState) => ({
        pages: currentState.pages.map((page) => {
          if (page.parentId !== parentId) return page;

          const nextPosition = positionById.get(page.id);
          return nextPosition === undefined
            ? page
            : { ...page, position: nextPosition };
        }),
      }));

      await db.updatePagePositions(updates);
    } catch (error) {
      console.error("Failed to reorder pages:", error);
    }
  },

  reorderRootPages: async (pageIds) => {
    await get().reorderPages(null, pageIds);
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
