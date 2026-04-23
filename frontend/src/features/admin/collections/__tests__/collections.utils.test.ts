import {
  getNextCollectionOrderIndex,
  moveCollectionCourse,
  sortCollectionsByOrderIndex,
  toggleCollectionCourse,
} from '../collections.utils';

describe('collections.utils', () => {
  it('toggles course ids inside a collection selection', () => {
    expect(toggleCollectionCourse(['a', 'b'], 'c')).toEqual(['a', 'b', 'c']);
    expect(toggleCollectionCourse(['a', 'b'], 'b')).toEqual(['a']);
  });

  it('moves selected courses up and down', () => {
    expect(moveCollectionCourse(['a', 'b', 'c'], 'b', 'up')).toEqual([
      'b',
      'a',
      'c',
    ]);
    expect(moveCollectionCourse(['a', 'b', 'c'], 'b', 'down')).toEqual([
      'a',
      'c',
      'b',
    ]);
  });

  it('builds the next collection order from the current collection count', () => {
    expect(getNextCollectionOrderIndex([])).toBe('1');
    expect(
      getNextCollectionOrderIndex([
        { orderIndex: 1 },
        { orderIndex: 8 },
      ]),
    ).toBe('3');
  });

  it('sorts collections by display order', () => {
    expect(
      sortCollectionsByOrderIndex([
        { id: 'third', orderIndex: 3 },
        { id: 'first', orderIndex: 1 },
      ]).map((collection) => collection.id),
    ).toEqual(['first', 'third']);
  });
});
