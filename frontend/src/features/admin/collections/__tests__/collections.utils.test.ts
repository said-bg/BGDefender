import {
  moveCollectionCourse,
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
});
