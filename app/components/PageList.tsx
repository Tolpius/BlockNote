import { FlatList, StyleSheet, TouchableOpacity } from "react-native";
import { SymbolView } from "expo-symbols";
import { Text, View } from "@/components/Themed";
import { Page } from "@/store/pages";

interface PageListProps {
  pages: Page[];
  onPagePress?: (pageId: string) => void;
  onDeletePage?: (pageId: string) => void;
  emptyComponent?: React.ReactNode;
}

export function PageList({
  pages,
  onPagePress,
  onDeletePage,
  emptyComponent,
}: PageListProps) {
  if (pages.length === 0 && emptyComponent) {
    return <>{emptyComponent}</>;
  }

  return (
    <FlatList
      data={pages}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View
          style={styles.pageItem}
          lightColor="#f5f5f5"
          darkColor="rgba(255, 255, 255, 0.1)"
        >
          <Text
            style={styles.pageTitle}
            onPress={() => onPagePress?.(item.id)}
          >
            • {item.title}
          </Text>
          {onDeletePage && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => onDeletePage(item.id)}
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
          )}
        </View>
      )}
      scrollEnabled={true}
      bounces={true}
    />
  );
}

const styles = StyleSheet.create({
  pageItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  pageTitle: {
    fontSize: 16,
    lineHeight: 24,
    flex: 1,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 12,
  },
});
