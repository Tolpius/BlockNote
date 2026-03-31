import { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
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
          onPress: (value) => {
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
