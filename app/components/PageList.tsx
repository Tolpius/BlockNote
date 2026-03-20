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

type PageRow = {
  page: Page;
  depth: number;
};

function buildPageRows(pages: Page[]): PageRow[] {
  const childrenByParent = new Map<string | null, Page[]>();

  for (const page of pages) {
    const key = page.parentId ?? null;
    const list = childrenByParent.get(key) ?? [];
    list.push(page);
    childrenByParent.set(key, list);
  }

  const sortByTitle = (a: Page, b: Page) => a.title.localeCompare(b.title);
  for (const [, list] of childrenByParent) {
    list.sort(sortByTitle);
  }

  const rows: PageRow[] = [];
  const visit = (parentId: string | null, depth: number) => {
    const children = childrenByParent.get(parentId) ?? [];
    for (const child of children) {
      rows.push({ page: child, depth });
      visit(child.id, depth + 1);
    }
  };

  visit(null, 0);
  return rows;
}

export function PageList({
  pages,
  onPagePress,
  onDeletePage,
  emptyComponent,
}: PageListProps) {
  const rows = buildPageRows(pages);

  if (pages.length === 0 && emptyComponent) {
    return <>{emptyComponent}</>;
  }

  return (
    <FlatList
      data={rows}
      keyExtractor={(item) => item.page.id}
      renderItem={({ item }) => (
        <View
          style={styles.pageItem}
          lightColor="#f5f5f5"
          darkColor="rgba(255, 255, 255, 0.1)"
        >
          <Text
            style={[
              styles.pageTitle,
              { marginLeft: item.depth * 16 },
              item.depth > 0 && styles.subPageTitle,
            ]}
            onPress={() => onPagePress?.(item.page.id)}
          >
            {item.depth > 0 ? "↳ " : "• "}
            {item.page.title}
          </Text>
          {onDeletePage && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => onDeletePage(item.page.id)}
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
  subPageTitle: {
    opacity: 0.9,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 12,
  },
});
