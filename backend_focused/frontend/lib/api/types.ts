import type { components } from './schema';

type Schemas = components['schemas'];

export type TokenPair = Schemas['TokenObtainPair'];
export type TokenRefresh = Schemas['TokenRefresh'];
export type Credentials = Schemas['TokenObtainPairRequest'];
