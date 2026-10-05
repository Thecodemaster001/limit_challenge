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
export type OfficePayload = Schemas['OfficeRequest'];

export type Vehicle = Schemas['Vehicle'];
export type VehicleCreatePayload = Schemas['VehicleRequest'];
export type VehicleUpdatePayload = Schemas['PatchedVehicleUpdateRequest'];
export type PaginatedVehicleList = Schemas['PaginatedVehicleList'];
export type VehicleListQuery = QueryOf<'vehicles_list'>;

export type DuplicateCheck = Schemas['DuplicateCheck'];
export type DuplicateCheckQuery = QueryOf<'vehicles_duplicate_check_retrieve'>;

export type VehicleDetail = Schemas['VehicleDetail'];
export type VehicleMaintenanceRecord = Schemas['VehicleMaintenanceRecord'];
export type PaginatedVehicleMaintenanceRecordList =
  Schemas['PaginatedVehicleMaintenanceRecordList'];
export type VehicleMaintenanceHistoryQuery = QueryOf<'vehicles_maintenance_history_list'>;
export type VehicleOfficeAssignment = Schemas['VehicleOfficeAssignmentRequest'];

export type MaintenanceType = Schemas['MaintenanceTypeEnum'];
export type MaintenanceRecord = Schemas['MaintenanceRecord'];
export type MaintenanceRecordCreatePayload = Schemas['MaintenanceRecordRequest'];
export type MaintenanceRecordUpdatePayload = Schemas['PatchedMaintenanceRecordRequest'];

export type Mechanic = Schemas['Mechanic'];
export type PaginatedMechanicList = Schemas['PaginatedMechanicList'];
export type MechanicListQuery = QueryOf<'mechanics_list'>;
export type MechanicPayload = Schemas['MechanicRequest'];
export type MechanicUpdatePayload = Schemas['PatchedMechanicRequest'];
