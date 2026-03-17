import {
  FlatList,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View as RNView,
} from "react-native";
import { SymbolView } from "expo-symbols";
import { useRouter } from "expo-router";
import { useState } from "react";
import { usePagesStore, Page } from "@/store/pages";
import { TextBlock } from "@/components/TextBlock";
import { Text, View } from "@/components/Themed";

interface EditorProps {
  page: Page;
}

export function Editor({ page }: EditorProps) {
  const router = useRouter();
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

      <View style={styles.documentShell}>
        <View style={styles.documentCard}>
          <FlatList
            data={blocks}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => <TextBlock block={item} />}
            ListHeaderComponent={<View style={styles.documentTopSpacer} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Start your document</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => addBlock(page.id)}
                >
                  <Text style={styles.addButtonText}>+ Add Block</Text>
                </TouchableOpacity>
              </View>
            }
            ListFooterComponent={
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => addBlock(page.id)}
              >
                <Text style={styles.addButtonText}>+ Add Block</Text>
              </TouchableOpacity>
            }
          />
        </View>
      </View>
    </View>
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
  list: {
    flex: 1,
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
    ...(Platform.OS === "ios"
      ? {
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
        }
      : { elevation: 2 }),
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  documentTopSpacer: {
    height: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 16,
    opacity: 0.6,
  },
  addButton: {
    marginTop: 12,
    marginBottom: 4,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#1b7fca",
    borderRadius: 8,
    alignItems: "center",
    alignSelf: "center",
    minWidth: 150,
    ...(Platform.OS === "ios"
      ? {
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
        }
      : { elevation: 1 }),
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
