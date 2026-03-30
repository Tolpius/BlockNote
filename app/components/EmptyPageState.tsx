import { StyleSheet } from "react-native";
import { Text, View } from "@/components/Themed";

export function EmptyPageState() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>No pages yet</Text>
      <Text style={styles.subtitle}>
        Create your first page to start your workspace
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    opacity: 0.65,
    textAlign: "center",
  },
});
