import { StyleSheet, TouchableOpacity } from "react-native";
import { usePagesStore } from "@/store/pages";
import { PageList } from "@/components/PageList";
import { EmptyPageState } from "@/components/EmptyPageState";
import { Text, View } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";

export default function HomeScreen() {
  const pages = usePagesStore((state) => state.pages);
  const addPage = usePagesStore((state) => state.addPage);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Pages</Text>
      <View style={styles.listContainer}>
        <PageList pages={pages} emptyComponent={<EmptyPageState />} />
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
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  listContainer: {
    flex: 1,
  },
  newPageButton: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  newPageButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
