import { describe, expect, it } from 'vitest';

import {
  clearVehicleFilters,
  hasInvalidDateRange,
  hasVehicleFilters,
  parseVehicleSearch,
  serializeVehicleSearch,
  toVehicleListQuery,
  updateVehicleSearch,
  VehicleSearch,
} from './vehicle-search-params';

const parse = (query: string) => parseVehicleSearch(new URLSearchParams(query));
const DEFAULT_SEARCH: VehicleSearch = parse('');

describe('parseVehicleSearch', () => {
  it('reads every filter from the URL', () => {
    const search = parse(
      'office=2&is_active=false&make=Ford&model=Transit&maintenance_date_from=2026-01-01' +
        '&maintenance_date_to=2026-03-31&mechanic_certification=MC-1&ordering=-year&page=3&page_size=25',
    );

    expect(search).toEqual({
      office: 2,
      is_active: false,
      make: 'Ford',
      model: 'Transit',
      maintenance_date_from: '2026-01-01',
      maintenance_date_to: '2026-03-31',
      mechanic_certification: 'MC-1',
      ordering: '-year',
      page: 3,
      page_size: 25,
    });
  });

  it('uses defaults for an empty URL', () => {
    expect(DEFAULT_SEARCH).toMatchObject({ page: 1, page_size: 10 });
    expect(hasVehicleFilters(DEFAULT_SEARCH)).toBe(false);
  });

  it.each([
    ['office=abc', 'office'],
    ['office=0', 'office'],
    ['office=-3', 'office'],
    ['is_active=yes', 'is_active'],
    ['make=%20%20', 'make'],
    ['maintenance_date_from=2026-02-31', 'maintenance_date_from'],
    ['maintenance_date_to=31/01/2026', 'maintenance_date_to'],
    ['ordering=password', 'ordering'],
    ['ordering=--year', 'ordering'],
  ] as const)('ignores the invalid value in %s', (query, field) => {
    expect(parse(query)[field]).toBeUndefined();
  });

  it('falls back to safe paging values', () => {
    expect(parse('page=abc&page_size=1000')).toMatchObject({ page: 1, page_size: 10 });
  });
});

describe('serializeVehicleSearch', () => {
  it('round-trips a search through the URL', () => {
    const query = 'office=2&is_active=true&make=Ford&ordering=license_plate&page=2&page_size=50';

    expect(serializeVehicleSearch(parse(query))).toBe(query);
  });

  it('leaves out defaults to keep URLs short', () => {
    expect(serializeVehicleSearch(DEFAULT_SEARCH)).toBe('');
  });
});

describe('updateVehicleSearch', () => {
  const onPageThree = parse('make=Ford&page=3');

  it('returns to the first page when a filter changes', () => {
    expect(updateVehicleSearch(onPageThree, { model: 'Transit' })).toMatchObject({
      make: 'Ford',
      model: 'Transit',
      page: 1,
    });
  });

  it('returns to the first page when sorting or page size changes', () => {
    expect(updateVehicleSearch(onPageThree, { ordering: '-year' }).page).toBe(1);
    expect(updateVehicleSearch(onPageThree, { page_size: 25 }).page).toBe(1);
  });

  it('keeps filters when only the page changes', () => {
    expect(updateVehicleSearch(onPageThree, { page: 4 })).toMatchObject({ make: 'Ford', page: 4 });
  });

  it('removes a filter set to undefined', () => {
    expect(serializeVehicleSearch(updateVehicleSearch(onPageThree, { make: undefined }))).toBe('');
  });
});

describe('helpers', () => {
  it('clears filters but keeps sorting and page size', () => {
    const cleared = clearVehicleFilters(parse('make=Ford&ordering=-year&page=2&page_size=25'));

    expect(serializeVehicleSearch(cleared)).toBe('ordering=-year&page_size=25');
  });

  it('detects a date range that ends before it starts', () => {
    expect(
      hasInvalidDateRange(parse('maintenance_date_from=2026-03-01&maintenance_date_to=2026-01-01')),
    ).toBe(true);
    expect(hasInvalidDateRange(parse('maintenance_date_from=2026-03-01'))).toBe(false);
  });

  it('builds an API query without undefined keys', () => {
    expect(toVehicleListQuery(parse('make=Ford'))).toEqual({
      make: 'Ford',
      page: 1,
      page_size: 10,
    });
  });
});
