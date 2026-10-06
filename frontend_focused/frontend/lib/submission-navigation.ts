export interface ListPage {
  ids: number[];
  page: number;
  pageSize: number;
  totalCount: number;
}

/** A neighbouring submission. `id` is unknown when it sits on the adjacent page. */
export interface Neighbor {
  id?: number;
  page: number;
}

export interface ListLocation {
  position: number;
  totalCount: number;
  previous: Neighbor | null;
  next: Neighbor | null;
}

/** Where a submission sits in a page of the list, and where its neighbours are. */
export function locateInList(list: ListPage, submissionId: number): ListLocation | null {
  const index = list.ids.indexOf(submissionId);
  if (index === -1) return null;

  const position = (list.page - 1) * list.pageSize + index + 1;
  const isFirstOnPage = index === 0;
  const isLastOnPage = index === list.ids.length - 1;

  return {
    position,
    totalCount: list.totalCount,
    previous:
      position > 1
        ? isFirstOnPage
          ? { page: list.page - 1 }
          : { id: list.ids[index - 1], page: list.page }
        : null,
    next:
      position < list.totalCount
        ? isLastOnPage
          ? { page: list.page + 1 }
          : { id: list.ids[index + 1], page: list.page }
        : null,
  };
}
