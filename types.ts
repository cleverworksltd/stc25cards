export interface PipeData {
  id: string;
  ref: string; // A, B, C... or X, Y
  status?: string;
  flow?: string;
  invertLevel?: string;
  depth?: string;
  nodeRef?: string; // Upstream or Downstream Node Ref
  shape?: string;
  material?: string;
  diameter?: string;
  backdropDia?: string;
  backdropDepth?: string;
}

export interface SurveyData {
  // Header
  cardNo: string;
  projectId: string;
  catchment: string;
  mhNo: string;
  location: string;
  town: string;
  
  // Meta
  status: string; 
  function: string; 
  mhType: string; 
  date: string;
  surveyor: string;

  // Cover
  coverShape: string[]; 
  coverLevel: string;
  coverDuty: string; 
  coverLength: string;
  coverWidth: string;
  openingType: string[]; 
  clearOpeningLength: string;
  clearOpeningWidth: string;

  // Pipes
  incomingPipes: PipeData[];
  outgoingPipes: PipeData[];

  // Construction
  chamberSize: string; 
  shaftSize: string;
  shaftDepth: string;
  constructionMaterial: string[]; 
  ladderStepRows: string;
  atmosphere: string; 
  siltDebrisStatus: string; 
  
  // Condition
  evidenceOfSurcharge: boolean;
  hasActiveFlow: boolean;
  hasInterceptor: boolean;
  hasNonReturnValve: boolean;
  hasVerminBlocker: boolean;
  hasHydroBrake: boolean;
  toxicAtmosphere: boolean;
  conditionCover: 'OK' | 'Needs Attention' | 'Urgent' | '';
  conditionShaft: 'OK' | 'Needs Attention' | 'Urgent' | '';
  conditionIrons: 'OK' | 'Needs Attention' | 'Urgent' | '';
  conditionChamber: 'OK' | 'Needs Attention' | 'Urgent' | '';
  conditionBenching: 'OK' | 'Needs Attention' | 'Urgent' | '';
  conditionChannel: 'OK' | 'Needs Attention' | 'Urgent' | '';
  
  depthFlow: string;
  depthSilt: string;
  surchargeHeight: string;
  interceptorDetails: string;

  remarks: string;

  // Media (8 Photos)
  photo1Url?: string; // Manhole Plan
  photo2Url?: string; // Manhole Location
  photo3Url?: string; // Internal View
  photo4Url?: string; // Additional Evidence
  photo5Url?: string; // Additional detail
  photo6Url?: string; // Additional detail
  photo7Url?: string; // Additional detail
  photo8Url?: string; // Additional detail
  photo4Label?: string;
  photo5Label?: string;
  photo6Label?: string;
  photo7Label?: string;
  mapLat?: number;
  mapLng?: number;
}

export const INITIAL_PIPES: PipeData[] = [
  { id: 'A', ref: 'A' }, { id: 'B', ref: 'B' }, { id: 'C', ref: 'C' },
  { id: 'D', ref: 'D' }, { id: 'E', ref: 'E' }, { id: 'F', ref: 'F' },
  { id: 'G', ref: 'G' }
];

export const INITIAL_OUT_PIPES: PipeData[] = [
  { id: 'X', ref: 'X' }, { id: 'Y', ref: 'Y' }
];

export const INITIAL_DATA: SurveyData = {
  cardNo: '', projectId: '', catchment: '', mhNo: 'MH0', location: '', town: '',
  status: '', function: '', mhType: '', date: new Date().toISOString().split('T')[0], surveyor: '',
  coverShape: [], coverLevel: 'TBC', coverDuty: '', 
  coverLength: '', coverWidth: '', openingType: [], clearOpeningLength: '', clearOpeningWidth: '',
  incomingPipes: [...INITIAL_PIPES],
  outgoingPipes: [...INITIAL_OUT_PIPES],
  chamberSize: '', shaftSize: '', shaftDepth: '', constructionMaterial: [], ladderStepRows: '0',
  atmosphere: 'Clear : O2 : 19.5%- 23.5% , LEL < 10%, CO < 35ppm, H2S < 10ppm', siltDebrisStatus: 'Minimal <10%',
  evidenceOfSurcharge: false, hasActiveFlow: false, hasInterceptor: false, hasNonReturnValve: false, hasVerminBlocker: false, hasHydroBrake: false, toxicAtmosphere: false,
  conditionCover: 'OK', conditionShaft: 'OK', conditionIrons: 'OK', conditionChamber: 'OK', conditionBenching: 'OK', conditionChannel: 'OK',
  depthFlow: '0', depthSilt: '0', surchargeHeight: '0', interceptorDetails: '',
  remarks: '',
  photo1Url: '', photo2Url: '', photo3Url: '', photo4Url: '',
  photo5Url: '', photo6Url: '', photo7Url: '', photo8Url: '',
  photo4Label: 'Additional Detail / Damage',
  photo5Label: 'Additional detail',
  photo6Label: 'Additional detail',
  photo7Label: 'Additional detail',
};