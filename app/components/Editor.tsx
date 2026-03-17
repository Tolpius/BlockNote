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
  useEditorContent,
  TenTapStartKit,
} from "@10play/tentap-editor";

interface EditorProps {
  page: Page;
}

function parseInitialContent(raw: string): string | object {
  if (!raw) return "";
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export function Editor({ page }: EditorProps) {
  const router = useRouter();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(page.title);
  const blocks = usePagesStore((state) => state.getPageBlocks(page.id));
  const updateBlock = usePagesStore((state) => state.updateBlock);
  const updatePage = usePagesStore((state) => state.updatePage);

  const masterBlock = blocks[0];

  // Refs so the save effect never has stale values without re-subscribing
  const masterBlockRef = useRef(masterBlock);
  masterBlockRef.current = masterBlock;
  const updateBlockRef = useRef(updateBlock);
  updateBlockRef.current = updateBlock;

  const editor = useEditorBridge({
    autofocus: false,
    avoidIosKeyboard: true,
    initialContent: parseInitialContent(masterBlock?.content ?? ""),
    bridgeExtensions: TenTapStartKit,
  });

  // Debounced (500 ms) content from the WebView – only fires when user types
  const content = useEditorContent(editor, {
    type: "json",
    debounceInterval: 500,
  });

  useEffect(() => {
    if (content === undefined) return;
    const block = masterBlockRef.current;
    if (!block) return;
    updateBlockRef.current(block.id, JSON.stringify(content));
  }, [content]);

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
        <View style={styles.documentCard}>
          <RichText editor={editor} style={styles.richText} />
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
