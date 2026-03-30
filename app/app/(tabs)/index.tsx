import { Alert, StyleSheet, TouchableOpacity } from "react-native";
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
  const reorderPages = usePagesStore((state) => state.reorderPages);
  const reorderRootPages = usePagesStore((state) => state.reorderRootPages);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

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
});
