import { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View as RNView,
} from "react-native";
import { useRouter } from "expo-router";
import { usePagesStore } from "@/store/pages";
import { PageList } from "@/components/PageList";
import { EmptyPageState } from "@/components/EmptyPageState";
import { Text, View } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

export default function HomeScreen() {
  const router = useRouter();
  const pages = usePagesStore((state) => state.pages);
  const addPage = usePagesStore((state) => state.addPage);
  const deletePage = usePagesStore((state) => state.deletePage);
  const updatePage = usePagesStore((state) => state.updatePage);
  const reorderPages = usePagesStore((state) => state.reorderPages);
  const reorderRootPages = usePagesStore((state) => state.reorderRootPages);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [renamePageId, setRenamePageId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const recentPages = useMemo(() => {
    return [...pages]
      .filter((page) => page.lastVisited !== null)
      .sort((a, b) => {
        const aVisited = a.lastVisited ? new Date(a.lastVisited).getTime() : 0;
        const bVisited = b.lastVisited ? new Date(b.lastVisited).getTime() : 0;
        if (aVisited !== bVisited) {
          return bVisited - aVisited;
        }

        return b.position - a.position;
      })
      .slice(0, 8);
  }, [pages]);

  const handlePagePress = (pageId: string) => {
    router.push(`/${pageId}`);
  };

  const handleDeletePage = (pageId: string) => {
    const page = pages.find((p) => p.id === pageId);
    if (!page) return;

    Alert.alert(
      "Delete Page?",
      `Are you sure you want to delete "${page.title}"? This cannot be undone.`,
      [
        { text: "Cancel", onPress: () => {} },
        {
          text: "Delete",
          onPress: () => {
            deletePage(pageId);
          },
          style: "destructive",
        },
      ],
    );
  };

  const handleAddSubpage = (parentId: string) => {
    addPage("Untitled", parentId);
  };

  const handleRenamePage = (pageId: string) => {
    const page = pages.find((p) => p.id === pageId);
    if (!page) return;

    if (Platform.OS === "web" && typeof window !== "undefined") {
      const nextTitle = window.prompt("Rename page", page.title);
      if (nextTitle === null) return;

      const trimmed = nextTitle.trim();
      if (trimmed.length > 0 && trimmed !== page.title) {
        updatePage(pageId, trimmed);
      }
      return;
    }

    if (Platform.OS !== "ios") {
      setRenamePageId(pageId);
      setRenameValue(page.title);
      setIsRenameModalVisible(true);
      return;
    }

    Alert.prompt(
      "Rename Page",
      undefined,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Save",
          onPress: (value?: string) => {
            const trimmed = value?.trim() ?? "";
            if (trimmed.length > 0 && trimmed !== page.title) {
              updatePage(pageId, trimmed);
            }
          },
        },
      ],
      "plain-text",
      page.title,
    );
  };

  const closeRenameModal = () => {
    setIsRenameModalVisible(false);
    setRenamePageId(null);
    setRenameValue("");
  };

  const saveRename = () => {
    if (!renamePageId) {
      closeRenameModal();
      return;
    }

    const page = pages.find((p) => p.id === renamePageId);
    if (!page) {
      closeRenameModal();
      return;
    }

    const trimmed = renameValue.trim();
    if (trimmed.length > 0 && trimmed !== page.title) {
      updatePage(renamePageId, trimmed);
    }
    closeRenameModal();
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBlock}>
        <Text style={styles.header}>Private Files</Text>
        <Text style={styles.subtitle}>
          Drag to reorder, tap chevrons to collapse
        </Text>
      </View>

      {recentPages.length > 0 ? (
        <View style={styles.recentSection}>
          <Text style={styles.sectionLabel}>Zuletzt geöffnet</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recentRail}
          >
            {recentPages.map((page) => (
              <TouchableOpacity
                key={page.id}
                style={styles.recentCard}
                activeOpacity={0.85}
                onPress={() => handlePagePress(page.id)}
              >
                <RNView style={styles.recentCardGlow} />
                <Text style={styles.recentCardTitle} numberOfLines={2}>
                  {page.title}
                </Text>
                <Text style={styles.recentCardMeta} numberOfLines={1}>
                  {page.parentId ? "Subpage" : "Root page"}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.listContainer}>
        <PageList
          pages={pages}
          onPagePress={handlePagePress}
          onDeletePage={handleDeletePage}
          onRenamePage={handleRenamePage}
          onAddSubpage={handleAddSubpage}
          onReorderPages={reorderPages}
          onReorderRootPages={reorderRootPages}
          emptyComponent={<EmptyPageState />}
        />
      </View>
      <TouchableOpacity
        style={[styles.newPageButton, { backgroundColor: colors.tint }]}
        onPress={() => addPage()}
        activeOpacity={0.7}
      >
        <Text style={styles.newPageButtonText}>+ New Page</Text>
      </TouchableOpacity>

      <Modal
        transparent
        animationType="fade"
        visible={isRenameModalVisible}
        onRequestClose={closeRenameModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rename Page</Text>
            <TextInput
              style={styles.modalInput}
              value={renameValue}
              onChangeText={setRenameValue}
              autoFocus
              selectTextOnFocus
              placeholder="Page title"
              returnKeyType="done"
              onSubmitEditing={saveRename}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={closeRenameModal}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSaveButton]}
                onPress={saveRename}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 8,
  },
  headerBlock: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  header: {
    fontSize: 30,
    fontWeight: "bold",
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    opacity: 0.62,
    marginTop: 4,
  },
  recentSection: {
    marginTop: 8,
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
    textTransform: "uppercase",
    opacity: 0.58,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  recentRail: {
    paddingHorizontal: 16,
    paddingBottom: 2,
    gap: 12,
  },
  recentCard: {
    width: 168,
    minHeight: 116,
    borderRadius: 20,
    padding: 14,
    overflow: "hidden",
    backgroundColor: "rgba(10,132,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(10,132,255,0.12)",
    justifyContent: "space-between",
  },
  recentCardGlow: {
    position: "absolute",
    top: -32,
    right: -36,
    width: 92,
    height: 92,
    borderRadius: 999,
    backgroundColor: "rgba(10,132,255,0.16)",
  },
  recentCardTitle: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "700",
    letterSpacing: -0.2,
    paddingRight: 8,
  },
  recentCardMeta: {
    fontSize: 12,
    fontWeight: "600",
    opacity: 0.58,
    marginTop: 10,
  },
  listContainer: {
    flex: 1,
    marginHorizontal: 6,
    marginBottom: 8,
    paddingVertical: 2,
  },
  newPageButton: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  newPageButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#d5d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 14,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  modalCancelButton: {
    backgroundColor: "#efeff4",
  },
  modalSaveButton: {
    backgroundColor: "#0a84ff",
  },
  modalCancelText: {
    color: "#222",
    fontSize: 15,
    fontWeight: "600",
  },
  modalSaveText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
