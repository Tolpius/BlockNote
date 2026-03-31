import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View as RNView,
} from "react-native";
import { SymbolView } from "expo-symbols";
import {
  NestableDraggableFlatList,
  NestableScrollContainer,
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Text } from "@/components/Themed";
import { Page } from "@/store/pages";

interface PageListProps {
  pages: Page[];
  onPagePress?: (pageId: string) => void;
  onDeletePage?: (pageId: string) => void;
  onRenamePage?: (pageId: string) => void;
  onAddSubpage?: (parentId: string) => void;
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
  onRenamePage,
  onAddSubpage,
  onReorderPages,
  onReorderRootPages,
  emptyComponent,
}: PageListProps) {
  const pagesByParent = useMemo(() => buildPagesByParent(pages), [pages]);
  const [collapsedById, setCollapsedById] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    // Keep only collapse states for pages that still exist.
    setCollapsedById((prev) => {
      const existingIds = new Set(pages.map((page) => page.id));
      const next: Record<string, boolean> = {};

      for (const [id, collapsed] of Object.entries(prev)) {
        if (existingIds.has(id)) {
          next[id] = collapsed;
        }
      }

      return next;
    });
  }, [pages]);

  if (pages.length === 0 && emptyComponent) {
    return <>{emptyComponent}</>;
  }

  const hasChildren = (pageId: string) =>
    (pagesByParent.get(pageId)?.length ?? 0) > 0;
  const isCollapsed = (pageId: string) => collapsedById[pageId] === true;

  const toggleCollapsed = (pageId: string) => {
    setCollapsedById((prev) => ({ ...prev, [pageId]: !prev[pageId] }));
  };

  const handleReorder = (parentId: string | null, pageIds: string[]) => {
    onReorderPages?.(parentId, pageIds);
    if (parentId === null) {
      onReorderRootPages?.(pageIds);
    }
  };

  const openPageMenu = (page: Page) => {
    const options = [] as {
      text: string;
      onPress?: () => void;
      style?: "default" | "cancel" | "destructive";
    }[];

    if (onRenamePage) {
      options.push({
        text: "Rename",
        onPress: () => onRenamePage(page.id),
      });
    }

    if (onAddSubpage) {
      options.push({
        text: "Create Subpage",
        onPress: () => onAddSubpage(page.id),
      });
    }

    if (onDeletePage) {
      options.push({
        text: "Delete",
        style: "destructive",
        onPress: () => onDeletePage(page.id),
      });
    }

    options.push({ text: "Cancel", style: "cancel" });

    Alert.alert(page.title, "", options);
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
    <TouchableOpacity
      style={[
        styles.pageItem,
        { marginLeft: depth * 14 },
        isActive && styles.activePageItem,
      ]}
      onPress={() => onPagePress?.(item.id)}
      onLongPress={drag}
      delayLongPress={180}
      activeOpacity={0.8}
    >
      <RNView style={styles.rowLeft}>
        {hasChildren(item.id) ? (
          <TouchableOpacity
            style={styles.collapseButton}
            onPress={() => toggleCollapsed(item.id)}
          >
            <SymbolView
              name={{
                ios: isCollapsed(item.id) ? "chevron.right" : "chevron.down",
                android: isCollapsed(item.id) ? "chevron_right" : "expand_more",
                web: isCollapsed(item.id) ? "chevron_right" : "expand_more",
              }}
              tintColor="#8a8a8f"
              size={18}
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.collapseButton}
            onPress={() => toggleCollapsed(item.id)}
          >
            <SymbolView
              name={{
                ios: isCollapsed(item.id) ? "chevron.right" : "chevron.down",
                android: isCollapsed(item.id) ? "chevron_right" : "expand_more",
                web: isCollapsed(item.id) ? "chevron_right" : "expand_more",
              }}
              tintColor="#c3c3c8"
              size={18}
            />
          </TouchableOpacity>
        )}

        <RNView style={styles.titlePressable}>
          <Text style={[styles.pageTitle, depth > 0 && styles.subPageTitle]}>
            {item.title}
          </Text>
        </RNView>
      </RNView>

      {onAddSubpage && (
        <TouchableOpacity
          style={styles.inlineAddSubpageButton}
          onPress={() => onAddSubpage(item.id)}
        >
          <SymbolView
            name={{ ios: "plus", android: "add", web: "add" }}
            tintColor="#7b7b81"
            size={18}
          />
        </TouchableOpacity>
      )}

      {(onRenamePage || onAddSubpage || onDeletePage) && (
        <TouchableOpacity
          style={styles.pageMenuButton}
          onPress={() => openPageMenu(item)}
        >
          <SymbolView
            name={{
              ios: "ellipsis",
              android: "more_horiz",
              web: "more_horiz",
            }}
            tintColor="#7b7b81"
            size={18}
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const renderBranch = (parentId: string | null, depth: number) => {
    const siblings = pagesByParent.get(parentId) ?? [];
    if (siblings.length === 0) return null;

    if (Platform.OS === "web") {
      return siblings.map((item) => (
        <RNView key={item.id}>
          {renderRow({ item, depth })}
          {hasChildren(item.id) && !isCollapsed(item.id)
            ? renderBranch(item.id, depth + 1)
            : null}
        </RNView>
      ));
    }

    return (
      <NestableDraggableFlatList
        key={`branch-${parentId ?? "root"}`}
        data={siblings}
        keyExtractor={(item) => item.id}
        renderItem={({ item, drag, isActive }: RenderItemParams<Page>) => (
          <ScaleDecorator>
            <RNView>
              {renderRow({ item, depth, drag, isActive })}
              {hasChildren(item.id) && !isCollapsed(item.id)
                ? renderBranch(item.id, depth + 1)
                : null}
            </RNView>
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
    return <RNView>{renderBranch(null, 0)}</RNView>;
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
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 8,
    marginHorizontal: 6,
    marginVertical: 1,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  collapseButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  collapsePlaceholder: {
    width: 24,
    height: 24,
    marginRight: 4,
  },
  inlineAddSubpageButton: {
    padding: 8,
    marginLeft: 2,
  },
  titlePressable: {
    flex: 1,
    paddingVertical: 2,
  },
  pageTitle: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "600",
  },
  subPageTitle: {
    opacity: 0.88,
    fontSize: 16,
    fontWeight: "500",
  },
  activePageItem: {
    opacity: 0.75,
  },
  pageMenuButton: {
    padding: 8,
    marginLeft: 0,
  },
});
