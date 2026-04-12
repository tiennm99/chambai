// Shared types for the Vietnamese test scoring application

export interface TestConfig {
  phanI: {
    questionCount: number;
    answers: string[];
  };
  phanII: {
    questionCount: number;
    answers: Array<TrueFalseAnswer>;
  };
  phanIII: {
    questionCount: number;
    answers: string[];
  };
  // Vietnamese THPT exam scoring weights
  scoring?: ScoringConfig;
}

export interface ScoringConfig {
  phanI: { pointsPerQuestion: number }; // default 0.25
  phanII: { pointsPerQuestion: number; partialCredit: boolean }; // default 0.25 per sub-option
  phanIII: { pointsPerQuestion: number }; // default 0.5
}

export interface TrueFalseAnswer {
  a: boolean;
  b: boolean;
  c: boolean;
  d: boolean;
}

export interface StudentResult {
  id: string;
  fileName: string;
  studentId: string;
  examCode?: string;
  phanI: string[];
  phanII: Array<TrueFalseAnswer>;
  phanIII: string[];
  processed: boolean;
  debugImageUrl?: string;
  score?: ScoreResult;
}

export interface ScoreResult {
  phanI: number;
  phanII: number;
  phanIII: number;
  total: number;
  maxTotal: number;
  percentage: number;
}

export interface ProcessingResult {
  studentId: string;
  examCode?: string;
  phanI: string[];
  phanII: Array<TrueFalseAnswer>;
  phanIII: string[];
  confidence: number;
  debugImageUrl?: string;
}

// OpenCV-related types
export interface Bubble {
  x: number;
  y: number;
  width: number;
  height: number;
  area: number;
  circularity: number;
  section?: string;
  column?: number;
  row?: number;
  question?: number;
  option?: string;
  subOption?: string;
  value?: boolean;
  digit?: number;
  symbol?: string;
}

export interface CornerMarkers {
  topLeft: Point;
  topRight: Point;
  bottomLeft: Point;
  bottomRight: Point;
}

export interface Point {
  x: number;
  y: number;
}

export interface MarkerDetectionResult {
  corners: Point[];
  edges: Point[];
  boundingBox?: {
    left: number;
    right: number;
    top: number;
    bottom: number;
    width: number;
    height: number;
  };
}
