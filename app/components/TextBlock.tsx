import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SymbolView } from "expo-symbols";
import { usePagesStore, Block } from "@/store/pages";

interface TextBlockProps {
  block: Block;
}

const BLOCK_FORMATS: Array<{ label: string; value: Block["format"] }> = [
  { label: "P", value: "paragraph" },
  { label: "H1", value: "heading1" },
  { label: "H2", value: "heading2" },
  { label: "\"", value: "quote" },
];

export function TextBlock({ block }: TextBlockProps) {
  const updateBlock = usePagesStore((state) => state.updateBlock);
  const updateBlockFormat = usePagesStore((state) => state.updateBlockFormat);
  const toggleBlockMark = usePagesStore((state) => state.toggleBlockMark);
  const deleteBlock = usePagesStore((state) => state.deleteBlock);

  const inputStyles = [
    styles.input,
    block.format === "heading1" && styles.heading1,
    block.format === "heading2" && styles.heading2,
    block.format === "quote" && styles.quote,
    block.isBold && styles.bold,
    block.isItalic && styles.italic,
    block.isUnderline && styles.underline,
  ];

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View style={styles.markButtons}>
          <Pressable
            style={[styles.markButton, block.isBold && styles.markButtonActive]}
            onPress={() => toggleBlockMark(block.id, "isBold")}
          >
            <Text style={styles.markButtonText}>B</Text>
          </Pressable>
          <Pressable
            style={[styles.markButton, block.isItalic && styles.markButtonActive]}
            onPress={() => toggleBlockMark(block.id, "isItalic")}
          >
            <Text style={styles.markButtonText}>I</Text>
          </Pressable>
          <Pressable
            style={[
              styles.markButton,
              block.isUnderline && styles.markButtonActive,
            ]}
            onPress={() => toggleBlockMark(block.id, "isUnderline")}
          >
            <Text style={styles.markButtonText}>U</Text>
          </Pressable>
        </View>

        <View style={styles.formatButtons}>
          {BLOCK_FORMATS.map((formatOption) => (
            <Pressable
              key={formatOption.value}
              style={[
                styles.formatButton,
                block.format === formatOption.value && styles.formatButtonActive,
              ]}
              onPress={() => updateBlockFormat(block.id, formatOption.value)}
            >
              <Text style={styles.formatButtonText}>{formatOption.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <TextInput
        style={inputStyles}
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
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ececec",
  },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  markButtons: {
    flexDirection: "row",
    gap: 6,
  },
  markButton: {
    minWidth: 28,
    minHeight: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#d7d7d7",
    backgroundColor: "#f7f7f7",
  },
  markButtonActive: {
    borderColor: "#2f95dc",
    backgroundColor: "#e8f4fd",
  },
  markButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#444",
  },
  formatButtons: {
    flexDirection: "row",
    gap: 6,
  },
  formatButton: {
    minWidth: 30,
    minHeight: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#d7d7d7",
    backgroundColor: "#f7f7f7",
    paddingHorizontal: 8,
  },
  formatButtonActive: {
    borderColor: "#2f95dc",
    backgroundColor: "#e8f4fd",
  },
  formatButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#444",
  },
  input: {
    minHeight: 64,
    fontSize: 16,
    lineHeight: 28,
    color: "#1f1f1f",
    paddingHorizontal: 2,
    paddingBottom: 4,
  },
  heading1: {
    fontSize: 34,
    lineHeight: 42,
    fontWeight: "700",
  },
  heading2: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: "600",
  },
  quote: {
    fontSize: 18,
    lineHeight: 30,
    fontStyle: "italic",
    color: "#4f4f4f",
  },
  bold: {
    fontWeight: "700",
  },
  italic: {
    fontStyle: "italic",
  },
  underline: {
    textDecorationLine: "underline",
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
