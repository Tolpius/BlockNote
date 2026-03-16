import { StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { SymbolView } from "expo-symbols";
import { usePagesStore, Block } from "@/store/pages";
import { View } from "@/components/Themed";

interface TextBlockProps {
  block: Block;
}

export function TextBlock({ block }: TextBlockProps) {
  const updateBlock = usePagesStore((state) => state.updateBlock);
  const deleteBlock = usePagesStore((state) => state.deleteBlock);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Start writing..."
        placeholderTextColor="#999"
        value={block.content}
        onChangeText={(text) => updateBlock(block.id, text)}
        multiline
        textAlignVertical="top"
      />
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteBlock(block.id)}
      >
        <SymbolView
          name={{
            ios: "trash.fill",
            android: "delete",
            web: "delete",
          }}
          tintColor="#999"
          size={18}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  input: {
    minHeight: 100,
    fontSize: 16,
    lineHeight: 24,
    color: "#000",
  },
  deleteButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignSelf: "flex-end",
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
