import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View as RNView,
} from "react-native";
import { SymbolView } from "expo-symbols";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { usePagesStore, Page } from "@/store/pages";
import { Text, View } from "@/components/Themed";
import {
  RichText,
  Toolbar,
  useEditorBridge,
  useBridgeState,
  useEditorContent,
  TenTapStartKit,
} from "@10play/tentap-editor";

interface EditorProps {
  page: Page;
}

type TiptapNode = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  content?: TiptapNode[];
};

type TiptapDoc = {
  type: "doc";
  content: TiptapNode[];
};

function parseInitialContent(raw: string): string | object {
  if (!raw) return "";
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function isDoc(value: unknown): value is TiptapDoc {
  if (!value || typeof value !== "object") return false;
  const maybeDoc = value as Partial<TiptapDoc>;
  return maybeDoc.type === "doc" && Array.isArray(maybeDoc.content);
}

function getNodeSize(node: TiptapNode): number {
  if (node.text !== undefined) return node.text.length;
  const children = node.content ?? [];
  const childSize = children.reduce(
    (sum, child) => sum + getNodeSize(child),
    0,
  );
  return childSize + 2;
}

function getActiveBlockIndex(doc: TiptapDoc, selectionFrom: number): number {
  const blocks = doc.content ?? [];
  if (blocks.length === 0) return -1;

  let pos = 1;
  for (let i = 0; i < blocks.length; i += 1) {
    const size = getNodeSize(blocks[i]);
    const end = pos + size;
    if (selectionFrom >= pos && selectionFrom < end) {
      return i;
    }
    pos = end;
  }

  return blocks.length - 1;
}

function getInitialDoc(raw: string): TiptapDoc {
  const parsed = parseInitialContent(raw);
  if (isDoc(parsed)) return parsed;
  return { type: "doc", content: [{ type: "paragraph" }] };
}

function getBlockTypeLabel(node?: TiptapNode): string {
  if (!node) return "P";
  if (node.type === "heading") {
    const level = Number(node.attrs?.level ?? 1);
    return level >= 2 ? "H2" : "H1";
  }
  if (node.type === "blockquote") return "Quote";
  return "P";
}

export function Editor({ page }: EditorProps) {
  const router = useRouter();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(page.title);
  const blocks = usePagesStore((state) => state.getPageBlocks(page.id));
  const updateBlock = usePagesStore((state) => state.updateBlock);
  const updatePage = usePagesStore((state) => state.updatePage);
  const addPage = usePagesStore((state) => state.addPage);

  const masterBlock = blocks[0];

  // Refs so the save effect never has stale values without re-subscribing
  const masterBlockRef = useRef(masterBlock);
  masterBlockRef.current = masterBlock;
  const updateBlockRef = useRef(updateBlock);
  updateBlockRef.current = updateBlock;
  const latestDocRef = useRef<TiptapDoc>(
    getInitialDoc(masterBlock?.content ?? ""),
  );
  const cssInjectedRef = useRef(false);
  const slashProcessingRef = useRef(false);
  const pendingSlashCommandRef = useRef<string | null>(null);

  const editor = useEditorBridge({
    autofocus: false,
    avoidIosKeyboard: true,
    initialContent: parseInitialContent(masterBlock?.content ?? ""),
    bridgeExtensions: TenTapStartKit,
  });
  const editorState = useBridgeState(editor);
  const selectionFrom = editorState?.selection?.from ?? 1;
  const activeBlockIndex = getActiveBlockIndex(
    latestDocRef.current,
    selectionFrom,
  );
  const activeNode = latestDocRef.current.content[activeBlockIndex];

  // Debounced (500 ms) content from the WebView – only fires when user types
  const content = useEditorContent(editor, {
    type: "json",
    debounceInterval: 500,
  });

  useEffect(() => {
    if (!masterBlock) return;
    const nextDoc = getInitialDoc(masterBlock.content ?? "");
    latestDocRef.current = nextDoc;
    editor.setContent(nextDoc);
  }, [masterBlock?.id]);

  useEffect(() => {
    if (content === undefined) return;
    const block = masterBlockRef.current;
    if (!block) return;
    if (isDoc(content)) {
      const processSlashCommands = async () => {
        if (slashProcessingRef.current) return;
        slashProcessingRef.current = true;

        let nextDoc = content;
        let changed = false;

        const nodes = [...(nextDoc.content ?? [])];
        for (let i = 0; i < nodes.length; i += 1) {
          const node = nodes[i];
          if (node.type !== "paragraph") continue;

          const firstText = node.content?.find(
            (n) => typeof n.text === "string",
          );
          const line = (firstText?.text ?? "").trim();
          const match = /^\/page(?:\s+(.*))?$/i.exec(line);
          if (!match) continue;

          const commandKey = `${page.id}:${i}:${line}`;
          if (pendingSlashCommandRef.current === commandKey) {
            latestDocRef.current = content;
            updateBlockRef.current(block.id, JSON.stringify(content));
            slashProcessingRef.current = false;
            return;
          }

          pendingSlashCommandRef.current = commandKey;
          const title = match[1]?.trim() || "Untitled";

          // Immediately replace the slash command so it cannot be processed twice.
          nodes[i] = {
            type: "paragraph",
            content: [{ type: "text", text: "Creating subpage..." }],
          };
          nextDoc = { ...nextDoc, content: nodes };
          latestDocRef.current = nextDoc;
          editor.setContent(nextDoc);
          updateBlockRef.current(block.id, JSON.stringify(nextDoc));

          const newPage = await addPage(title, page.id);

          if (newPage) {
            nodes[i] = {
              type: "paragraph",
              content: [
                { type: "text", text: "Subpage: " },
                {
                  type: "text",
                  text: newPage.title,
                  marks: [
                    {
                      type: "link",
                      attrs: { href: `blocknote://page/${newPage.id}` },
                    },
                  ],
                },
              ],
            };
            nextDoc = { ...nextDoc, content: nodes };
            latestDocRef.current = nextDoc;
            editor.setContent(nextDoc);
            updateBlockRef.current(block.id, JSON.stringify(nextDoc));

            pendingSlashCommandRef.current = null;
            slashProcessingRef.current = false;
            router.push(`/${newPage.id}`);
            return;
          }

          // Creation failed: keep a visible hint instead of the slash command.
          nodes[i] = {
            type: "paragraph",
            content: [
              { type: "text", text: `Failed to create subpage: ${title}` },
            ],
          };
          nextDoc = { ...nextDoc, content: nodes };
          latestDocRef.current = nextDoc;
          editor.setContent(nextDoc);
          updateBlockRef.current(block.id, JSON.stringify(nextDoc));
          pendingSlashCommandRef.current = null;

          break;
        }

        if (changed) {
          nextDoc = { ...nextDoc, content: nodes };
          latestDocRef.current = nextDoc;
          editor.setContent(nextDoc);
          updateBlockRef.current(block.id, JSON.stringify(nextDoc));
        } else {
          latestDocRef.current = content;
          updateBlockRef.current(block.id, JSON.stringify(content));
        }

        slashProcessingRef.current = false;
      };

      processSlashCommands().catch((error) => {
        pendingSlashCommandRef.current = null;
        slashProcessingRef.current = false;
        console.error("Failed to process slash command:", error);
      });

      return;
    }
    updateBlockRef.current(block.id, JSON.stringify(content));
  }, [addPage, content, editor, page.id, router]);

  useEffect(() => {
    if (cssInjectedRef.current) return;
    editor.injectCSS(`
      .ProseMirror > * {
        border-radius: 8px;
        transition: background-color 120ms ease;
        position: relative;
      }
      .ProseMirror > *[data-active-block="true"] {
        background-color: rgba(47, 149, 220, 0.08);
        box-shadow: inset 3px 0 0 #2f95dc;
      }
      .ProseMirror > *[data-active-block="true"]::before {
        content: '⋮⋮';
        position: absolute;
        left: -24px;
        top: 6px;
        color: #7a7a7a;
        font-size: 12px;
        letter-spacing: -1px;
      }
    `);
    cssInjectedRef.current = true;
  }, []);

  useEffect(() => {
    editor.injectJS(`
      (function() {
        var root = document.querySelector('.ProseMirror');
        if (!root) return;
        var children = root.children;
        for (var i = 0; i < children.length; i++) {
          if (i === ${activeBlockIndex}) {
            children[i].setAttribute('data-active-block', 'true');
          } else {
            children[i].removeAttribute('data-active-block');
          }
        }
      })();
      true;
    `);
  }, [activeBlockIndex]);

  const handleAddBlockBelow = async () => {
    const rawDoc = await editor.getJSON();
    const doc = isDoc(rawDoc) ? rawDoc : latestDocRef.current;
    const nodes = [...(doc.content ?? [])];
    const baseIndex =
      activeBlockIndex >= 0 ? activeBlockIndex : nodes.length - 1;
    const insertAt = Math.min(Math.max(baseIndex + 1, 0), nodes.length);
    nodes.splice(insertAt, 0, { type: "paragraph" });

    const nextDoc: TiptapDoc = { type: "doc", content: nodes };
    latestDocRef.current = nextDoc;
    editor.setContent(nextDoc);
  };

  const handleDeleteActiveBlock = async () => {
    const rawDoc = await editor.getJSON();
    const doc = isDoc(rawDoc) ? rawDoc : latestDocRef.current;
    const nodes = [...(doc.content ?? [])];
    if (nodes.length === 0) return;

    const targetIndex =
      activeBlockIndex >= 0 ? activeBlockIndex : nodes.length - 1;
    nodes.splice(targetIndex, 1);

    const safeNodes = nodes.length > 0 ? nodes : [{ type: "paragraph" }];
    const nextDoc: TiptapDoc = { type: "doc", content: safeNodes };
    latestDocRef.current = nextDoc;
    editor.setContent(nextDoc);
  };

  const handleMoveActiveBlockUp = async () => {
    const rawDoc = await editor.getJSON();
    const doc = isDoc(rawDoc) ? rawDoc : latestDocRef.current;
    const nodes = [...(doc.content ?? [])];
    if (nodes.length <= 1) return;

    const targetIndex =
      activeBlockIndex >= 0 ? activeBlockIndex : nodes.length - 1;
    if (targetIndex <= 0) return;

    [nodes[targetIndex - 1], nodes[targetIndex]] = [
      nodes[targetIndex],
      nodes[targetIndex - 1],
    ];

    const nextDoc: TiptapDoc = { type: "doc", content: nodes };
    latestDocRef.current = nextDoc;
    editor.setContent(nextDoc);
  };

  const handleMoveActiveBlockDown = async () => {
    const rawDoc = await editor.getJSON();
    const doc = isDoc(rawDoc) ? rawDoc : latestDocRef.current;
    const nodes = [...(doc.content ?? [])];
    if (nodes.length <= 1) return;

    const targetIndex =
      activeBlockIndex >= 0 ? activeBlockIndex : nodes.length - 1;
    if (targetIndex < 0 || targetIndex >= nodes.length - 1) return;

    [nodes[targetIndex], nodes[targetIndex + 1]] = [
      nodes[targetIndex + 1],
      nodes[targetIndex],
    ];

    const nextDoc: TiptapDoc = { type: "doc", content: nodes };
    latestDocRef.current = nextDoc;
    editor.setContent(nextDoc);
  };

  const canMoveActiveBlockUp =
    latestDocRef.current.content.length > 1 && activeBlockIndex > 0;
  const canMoveActiveBlockDown =
    latestDocRef.current.content.length > 1 &&
    activeBlockIndex >= 0 &&
    activeBlockIndex < latestDocRef.current.content.length - 1;

  const canDeleteActiveBlock = !(
    latestDocRef.current.content.length <= 1 &&
    (activeNode?.type === "paragraph" || !activeNode?.type)
  );

  const handleSaveTitle = () => {
    if (editTitle.trim()) {
      updatePage(page.id, editTitle.trim());
      setIsEditingTitle(false);
    }
  };

  if (!masterBlock) return null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.headerContainer}>
        {isEditingTitle ? (
          <RNView style={styles.editTitleContainer}>
            <TextInput
              style={styles.titleInput}
              value={editTitle}
              onChangeText={setEditTitle}
              autoFocus
              placeholder="Page title"
            />
            <TouchableOpacity
              style={styles.saveTitleButton}
              onPress={handleSaveTitle}
            >
              <Text style={styles.saveTitleButtonText}>Save</Text>
            </TouchableOpacity>
          </RNView>
        ) : (
          <RNView style={styles.titleDisplayContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <SymbolView
                name={{
                  ios: "chevron.left",
                  android: "arrow_back",
                  web: "arrow_back",
                }}
                tintColor="#2f95dc"
                size={24}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsEditingTitle(true)}>
              <Text style={styles.title}>{page.title}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditingTitle(true)}
            >
              <SymbolView
                name={{
                  ios: "pencil",
                  android: "edit",
                  web: "edit",
                }}
                tintColor="#2f95dc"
                size={18}
              />
            </TouchableOpacity>
          </RNView>
        )}
      </View>

      {/* Document canvas */}
      <View style={styles.documentShell}>
        <View style={styles.blockControlsRow}>
          <View style={styles.blockIndicatorWrap}>
            <Text style={styles.blockIndicatorText}>
              Block {Math.max(activeBlockIndex + 1, 1)} -{" "}
              {getBlockTypeLabel(activeNode)}
            </Text>
          </View>
          <View style={styles.blockActions}>
            <TouchableOpacity
              style={styles.blockActionButton}
              onPress={handleAddBlockBelow}
            >
              <SymbolView
                name={{ ios: "plus", android: "add", web: "add" }}
                tintColor="#1b7fca"
                size={16}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.blockActionButton,
                !canMoveActiveBlockUp && styles.blockActionButtonDisabled,
              ]}
              onPress={handleMoveActiveBlockUp}
              disabled={!canMoveActiveBlockUp}
            >
              <SymbolView
                name={{
                  ios: "arrow.up",
                  android: "arrow_upward",
                  web: "arrow_upward",
                }}
                tintColor={canMoveActiveBlockUp ? "#1b7fca" : "#b8b8b8"}
                size={16}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.blockActionButton,
                !canMoveActiveBlockDown && styles.blockActionButtonDisabled,
              ]}
              onPress={handleMoveActiveBlockDown}
              disabled={!canMoveActiveBlockDown}
            >
              <SymbolView
                name={{
                  ios: "arrow.down",
                  android: "arrow_downward",
                  web: "arrow_downward",
                }}
                tintColor={canMoveActiveBlockDown ? "#1b7fca" : "#b8b8b8"}
                size={16}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.blockActionButton,
                !canDeleteActiveBlock && styles.blockActionButtonDisabled,
              ]}
              onPress={handleDeleteActiveBlock}
              disabled={!canDeleteActiveBlock}
            >
              <SymbolView
                name={{ ios: "trash", android: "delete", web: "delete" }}
                tintColor={canDeleteActiveBlock ? "#c03b35" : "#b8b8b8"}
                size={16}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.documentCard}>
          <RichText
            editor={editor}
            style={styles.richText}
            onShouldStartLoadWithRequest={(request) => {
              const url = request?.url ?? "";
              const match = /^blocknote:\/\/page\/(.+)$/.exec(url);
              if (match) {
                router.push(`/${match[1]}`);
                return false;
              }
              return true;
            }}
          />
        </View>
      </View>

      {/* Formatting toolbar – floats above keyboard */}
      <Toolbar editor={editor} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#fafafa",
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e4",
  },
  titleDisplayContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    padding: 8,
    marginRight: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    flex: 1,
    color: "#1f1f1f",
  },
  editButton: {
    padding: 8,
    marginLeft: 12,
  },
  editTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  titleInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: "bold",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#2f95dc",
    borderRadius: 4,
    color: "#000",
  },
  saveTitleButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#2f95dc",
    borderRadius: 4,
  },
  saveTitleButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  documentShell: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  blockControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 6,
    gap: 8,
  },
  blockIndicatorWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  blockIndicatorText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#5d5d5d",
  },
  blockActions: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  blockActionButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#d6d6d6",
    backgroundColor: "#fff",
  },
  blockActionButtonDisabled: {
    borderColor: "#e6e6e6",
    backgroundColor: "#f8f8f8",
  },
  documentCard: {
    flex: 1,
    alignSelf: "center",
    width: "100%",
    maxWidth: 860,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e8e8e8",
    overflow: "hidden",
    ...(Platform.OS === "ios"
      ? {
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
        }
      : { elevation: 2 }),
  },
  richText: {
    flex: 1,
  },
});
