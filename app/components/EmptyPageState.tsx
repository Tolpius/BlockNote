import { StyleSheet } from "react-native";
import { Text, View } from "@/components/Themed";

export function EmptyPageState() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>No pages yet</Text>
      <Text style={styles.subtitle}>Create your first page</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.6,
  },
});
