import { Platform, StyleSheet, TouchableOpacity } from "react-native";
import { SymbolView } from "expo-symbols";
import DraggableFlatList, {
  NestableDraggableFlatList,
  NestableScrollContainer,
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
  onReorderPages?: (parentId: string | null, pageIds: string[]) => void;
  onReorderRootPages?: (pageIds: string[]) => void;
  emptyComponent?: React.ReactNode;
}

function sortByPositionThenTitle(a: Page, b: Page) {
  if (a.position !== b.position) {
    return a.position - b.position;
  }
  return a.title.localeCompare(b.title);
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
  onReorderPages,
  onReorderRootPages,
  emptyComponent,
}: PageListProps) {
  const pagesByParent = buildPagesByParent(pages);
  const rootPages = pagesByParent.get(null) ?? [];

  if (pages.length === 0 && emptyComponent) {
    return <>{emptyComponent}</>;
  }

  const handleReorder = (parentId: string | null, pageIds: string[]) => {
    onReorderPages?.(parentId, pageIds);
    if (parentId === null) {
      onReorderRootPages?.(pageIds);
    }
  };

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
        style={[
          styles.pageTitle,
          { marginLeft: depth * 16 },
          depth > 0 && styles.subPageTitle,
        ]}
        onPress={() => onPagePress?.(item.id)}
      >
        {depth > 0 ? "↳ " : "• "}
        {item.title}
      </Text>

      {drag && (
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

  const renderBranch = (parentId: string | null, depth: number) => {
    const siblings = pagesByParent.get(parentId) ?? [];
    if (siblings.length === 0) return null;

    if (Platform.OS === "web") {
      return siblings.map((item) => (
        <View key={item.id}>
          {renderRow({ item, depth })}
          {renderBranch(item.id, depth + 1)}
        </View>
      ));
    }

    return (
      <NestableDraggableFlatList
        key={`branch-${parentId ?? "root"}`}
        data={siblings}
        keyExtractor={(item) => item.id}
        renderItem={({ item, drag, isActive }: RenderItemParams<Page>) => (
          <ScaleDecorator>
            <View>
              {renderRow({ item, depth, drag, isActive })}
              {renderBranch(item.id, depth + 1)}
            </View>
          </ScaleDecorator>
        )}
        onDragEnd={({ data }) => {
          handleReorder(
            parentId,
            data.map((item) => item.id),
          );
        }}
        scrollEnabled={false}
        bounces={false}
      />
    );
  };

  if (Platform.OS === "web") {
    return <View>{renderBranch(null, 0)}</View>;
  }

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <NestableScrollContainer>{renderBranch(null, 0)}</NestableScrollContainer>
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
