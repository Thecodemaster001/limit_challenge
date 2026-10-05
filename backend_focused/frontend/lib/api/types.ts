import type { components, operations } from './schema';

type Schemas = components['schemas'];
type QueryOf<Operation extends keyof operations> = NonNullable<
  operations[Operation]['parameters']['query']
>;

export type TokenPair = Schemas['TokenObtainPair'];
export type TokenRefresh = Schemas['TokenRefresh'];
export type Credentials = Schemas['TokenObtainPairRequest'];

export type Office = Schemas['Office'];
export type PaginatedOfficeList = Schemas['PaginatedOfficeList'];
export type OfficeListQuery = QueryOf<'offices_list'>;

export type Vehicle = Schemas['Vehicle'];
export type PaginatedVehicleList = Schemas['PaginatedVehicleList'];
export type VehicleListQuery = QueryOf<'vehicles_list'>;
