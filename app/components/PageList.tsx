import { FlatList, Platform, StyleSheet, TouchableOpacity } from "react-native";
import { SymbolView } from "expo-symbols";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Text, View } from "@/components/Themed";
import { Page } from "@/store/pages";

interface PageListProps {
  pages: Page[];
  onPagePress?: (pageId: string) => void;
  onDeletePage?: (pageId: string) => void;
  onReorderRootPages?: (pageIds: string[]) => void;
  emptyComponent?: React.ReactNode;
}

type PageRow = {
  page: Page;
  depth: number;
};

function sortByPositionThenTitle(a: Page, b: Page) {
  if (a.position !== b.position) {
    return a.position - b.position;
  }
  return a.title.localeCompare(b.title);
}

function buildChildrenRows(
  pagesByParent: Map<string | null, Page[]>,
  parentId: string,
  depth: number,
): PageRow[] {
  const children = pagesByParent.get(parentId) ?? [];
  const rows: PageRow[] = [];

  for (const child of children) {
    rows.push({ page: child, depth });
    rows.push(...buildChildrenRows(pagesByParent, child.id, depth + 1));
  }

  return rows;
}

function buildPagesByParent(pages: Page[]): Map<string | null, Page[]> {
  const childrenByParent = new Map<string | null, Page[]>();

  for (const page of pages) {
    const key = page.parentId ?? null;
    const list = childrenByParent.get(key) ?? [];
    list.push(page);
    childrenByParent.set(key, list);
  }

  for (const [, list] of childrenByParent) {
    list.sort(sortByPositionThenTitle);
  }

  return childrenByParent;
}

export function PageList({
  pages,
  onPagePress,
  onDeletePage,
  onReorderRootPages,
  emptyComponent,
}: PageListProps) {
  const pagesByParent = buildPagesByParent(pages);
  const rootPages = pagesByParent.get(null) ?? [];

  if (pages.length === 0 && emptyComponent) {
    return <>{emptyComponent}</>;
  }

  const renderRow = ({
    item,
    depth,
    drag,
    isActive,
  }: {
    item: Page;
    depth: number;
    drag?: () => void;
    isActive?: boolean;
  }) => (
    <View
      style={[styles.pageItem, isActive && styles.activePageItem]}
      lightColor="#f5f5f5"
      darkColor="rgba(255, 255, 255, 0.1)"
    >
      <Text
        style={[styles.pageTitle, { marginLeft: depth * 16 }, depth > 0 && styles.subPageTitle]}
        onPress={() => onPagePress?.(item.id)}
      >
        {depth > 0 ? "↳ " : "• "}
        {item.title}
      </Text>

      {depth === 0 && drag && (
        <TouchableOpacity style={styles.dragHandle} onLongPress={drag}>
          <SymbolView
            name={{
              ios: "line.3.horizontal",
              android: "drag_indicator",
              web: "drag_indicator",
            }}
            tintColor="#999"
            size={20}
          />
        </TouchableOpacity>
      )}

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
  );

  const renderRootItem = ({ item, drag, isActive }: RenderItemParams<Page>) => {
    const childRows = buildChildrenRows(pagesByParent, item.id, 1);

    return (
      <ScaleDecorator>
        <View>
          {renderRow({ item, depth: 0, drag, isActive })}
          {childRows.map((childRow) => (
            <View key={childRow.page.id}>{renderRow({ item: childRow.page, depth: childRow.depth })}</View>
          ))}
        </View>
      </ScaleDecorator>
    );
  };

  if (Platform.OS === "web") {
    return (
      <FlatList
        data={rootPages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const childRows = buildChildrenRows(pagesByParent, item.id, 1);
          return (
            <View>
              {renderRow({ item, depth: 0 })}
              {childRows.map((childRow) => (
                <View key={childRow.page.id}>
                  {renderRow({ item: childRow.page, depth: childRow.depth })}
                </View>
              ))}
            </View>
          );
        }}
        scrollEnabled={true}
        bounces={true}
      />
    );
  }

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <DraggableFlatList
        data={rootPages}
        keyExtractor={(item) => item.id}
        renderItem={renderRootItem}
        onDragEnd={({ data }) => {
          onReorderRootPages?.(data.map((item) => item.id));
        }}
        scrollEnabled={true}
        bounces={true}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
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
  activePageItem: {
    opacity: 0.8,
  },
  dragHandle: {
    padding: 8,
    marginLeft: 4,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 4,
  },
});
