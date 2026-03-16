import { StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { usePagesStore } from "@/store/pages";
import { Editor } from "@/components/Editor";
import { Text, View } from "@/components/Themed";

export default function PageDetailScreen() {
  const { pageId } = useLocalSearchParams<{ pageId: string }>();
  const pages = usePagesStore((state) => state.pages);
  const addBlock = usePagesStore((state) => state.addBlock);

  // Find the page
  const page = pages.find((p) => p.id === pageId);

  // Get blocks for the page
  const blocks = usePagesStore((state) => state.getPageBlocks(page?.id || ""));

  // Initialize with empty block on first load if needed
  if (page && blocks.length === 0) {
    addBlock(page.id);
  }

  // Render page not found
  if (!page) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Page not found</Text>
      </View>
    );
  }

  return <Editor page={page} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 16,
  },
});
