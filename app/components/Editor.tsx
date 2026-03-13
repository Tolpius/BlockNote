import {
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View as RNView,
} from "react-native";
import { useState } from "react";
import { usePagesStore, Page } from "@/store/pages";
import { TextBlock } from "@/components/TextBlock";
import { Text, View } from "@/components/Themed";

interface EditorProps {
  page: Page;
  onDeletePage?: () => void;
}

export function Editor({ page, onDeletePage }: EditorProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(page.title);
  const blocks = usePagesStore((state) => state.getPageBlocks(page.id));
  const addBlock = usePagesStore((state) => state.addBlock);
  const updatePage = usePagesStore((state) => state.updatePage);

  const handleSaveTitle = () => {
    if (editTitle.trim()) {
      updatePage(page.id, editTitle.trim());
      setIsEditingTitle(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Title Header */}
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
            <TouchableOpacity onPress={() => setIsEditingTitle(true)}>
              <Text style={styles.title}>{page.title}</Text>
            </TouchableOpacity>
            {onDeletePage && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={onDeletePage}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            )}
          </RNView>
        )}
      </View>

      {/* Blocks */}
      {blocks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No blocks yet</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => addBlock(page.id)}
          >
            <Text style={styles.addButtonText}>+ Add Block</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={blocks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TextBlock block={item} />}
          scrollEnabled={true}
          ListFooterComponent={
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => addBlock(page.id)}
            >
              <Text style={styles.addButtonText}>+ Add Block</Text>
            </TouchableOpacity>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  titleDisplayContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    flex: 1,
  },
  deleteButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#ff3b30",
    borderRadius: 4,
    marginLeft: 12,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  editTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  titleInput: {
    flex: 1,
    fontSize: 24,
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
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 16,
    opacity: 0.6,
  },
  addButton: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#2f95dc",
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
