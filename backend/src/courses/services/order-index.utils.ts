type OrderedEntity = {
  id: string;
  orderIndex: number;
};

export const clampOrderIndex = (requestedOrder: number, maxOrder: number) =>
  Math.min(Math.max(requestedOrder, 1), Math.max(maxOrder, 1));

export const normalizeOrderIndexes = <T extends OrderedEntity>(items: T[]) => {
  const sortedItems = [...items].sort(
    (left, right) =>
      left.orderIndex - right.orderIndex || left.id.localeCompare(right.id),
  );

  return sortedItems.flatMap((item, index) => {
    const normalizedOrderIndex = index + 1;
    if (item.orderIndex === normalizedOrderIndex) {
      return [];
    }

    item.orderIndex = normalizedOrderIndex;
    return item;
  });
};

export const shiftForInsert = <T extends OrderedEntity>(
  items: T[],
  insertedOrder: number,
) =>
  items.filter((item) => item.orderIndex >= insertedOrder).map((item) => {
    item.orderIndex += 1;
    return item;
  });

export const shiftForMove = <T extends OrderedEntity>(
  items: T[],
  currentId: string,
  previousOrder: number,
  nextOrder: number,
) => {
  if (nextOrder === previousOrder) {
    return [];
  }

  return items
    .filter((item) => item.id !== currentId)
    .filter((item) =>
      nextOrder < previousOrder
        ? item.orderIndex >= nextOrder && item.orderIndex < previousOrder
        : item.orderIndex <= nextOrder && item.orderIndex > previousOrder,
    )
    .map((item) => {
      item.orderIndex += nextOrder < previousOrder ? 1 : -1;
      return item;
    });
};

export const shiftAfterDelete = <T extends OrderedEntity>(
  items: T[],
  removedId: string,
  removedOrder: number,
) =>
  items
    .filter((item) => item.id !== removedId && item.orderIndex > removedOrder)
    .map((item) => {
      item.orderIndex -= 1;
      return item;
    });
