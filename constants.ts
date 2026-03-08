export const LOGO_URL = "https://i.postimg.cc/C1w7QpJM/LOGO-200-60.png";

export const SHAPES = ['Square', 'Rectangle', 'Triangle', 'Dbl Triangle', 'Circular', 'Oval'];
export const MATERIALS = ['Pre Cast Concrete', 'In Situ Concrete', 'Brick', 'GRP', 'Arch', 'Corbel', 'Taper'];

export const OPENING_TYPES = [
  'Hinged', 
  'Lockable', 
  'Gas Tight', 
  'Water Tight', 
  'Other', 
  'N/A'
];

export const ATMOSPHERE_OPTIONS = [
  'Clear : O2 : 19.5%- 23.5% , LEL < 10%, CO < 35ppm, H2S < 10ppm',
  'Hazardous: O2 < 19.5% or H2S >10ppm',
  'Flammable: LEL 10%-25%',
  'DO NOT Enter : LEL >25%, Extreme Toxicity'
];

export const SILT_DEBRIS_OPTIONS = [
  'Minimal <10%',
  'Moderate 10-25%',
  'Serious 25-50%',
  'Severe >50%',
  'Blocked'
];

// LEGEND CODES FROM PHOTO
export const PIPE_STATUS_CODES = [
  { code: '1', label: 'SEWER' },
  { code: '2', label: 'WATERCOURSE' },
  { code: '3', label: 'PRIVATE GULLEY' },
  { code: '4', label: 'HIGHWAY' },
  { code: '5', label: 'OUTFALL' },
  { code: '6', label: 'INLET' },
  { code: '8', label: 'OVERFLOW' },
  { code: '9', label: 'NOT KNOWN' },
];

export const PIPE_FLOW_CODES = [
  { code: '1', label: 'GRAVITY' },
  { code: '2', label: 'RISING MAIN' },
  { code: '3', label: 'SYPHON' },
  { code: '4', label: 'INVERTED SYPHON' },
  { code: '9', label: 'NOT KNOWN' },
];

export const PIPE_SHAPE_CODES = [
  { code: '1', label: 'CIRCULAR' },
  { code: '2', label: 'EGG' },
  { code: '3', label: 'RECTANGULAR' },
  { code: '4', label: 'TRAPEZOIDAL' },
  { code: '9', label: 'OTHER' },
];

export const PIPE_MATERIAL_CODES = [
  { code: '1', label: 'VITRIFIED CLAY' },
  { code: '2', label: 'PRECAST CONCRETE' },
  { code: '3', label: 'IN SITU CONCRETE' },
  { code: '4', label: 'CAST IRON' },
  { code: '5', label: 'DUCTILE IRON' },
  { code: '6', label: 'SPUN IRON' },
  { code: '7', label: 'UPVC' },
  { code: '8', label: 'POLYETHYLENE' },
  { code: '9', label: 'BRICK' },
  { code: '10', label: 'STONE' },
  { code: '11', label: 'ASBESTOS CEMENT' },
  { code: '12', label: 'PITCH FIBRE' },
  { code: '0', label: 'OTHER' },
];

export const STATUS_OPTIONS = [
  { value: 'PU', label: 'Public' },
  { value: 'PR', label: 'Private' },
  { value: 'WC', label: 'Culverted Watercourse' },
  { value: '24', label: 'Section 24' },
  { value: 'HD', label: 'Highway Drain' },
];

export const FUNCTION_OPTIONS = [
  { value: 'F', label: 'Foul' },
  { value: 'C', label: 'Combined' },
  { value: 'S', label: 'Surface Water' },
];

export const TYPE_OPTIONS = [
  { value: 'MH', label: 'Manhole' },
  { value: 'CP', label: 'Catchpit' },
  { value: 'LH', label: 'Lamphole' },
  { value: 'RE', label: 'Rodding Eye' },
  { value: 'SO', label: 'Storm Overflow' },
  { value: 'GU', label: 'Gully' },
  { value: 'OF', label: 'Outfall' },
];

export const PIPE_MATERIALS = [
  'VC', 'PVC', 'Concrete', 'Clay', 'Iron', 'Steel', 'Plastic'
];