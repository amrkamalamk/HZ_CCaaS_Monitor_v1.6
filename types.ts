
export interface UnifiedDataPoint {
  timestamp: string;
  offered: number;
  answered: number;
  abandoned: number;
  mos: number | null;
  aht: number | null; // Average Handle Time in seconds
  agentsCount: number; // Number of unique agents active in this interval
  slPercent: number | null; // Service Level Percentage
  conversationsCount: number;
}

export interface CustomerConversation {
  id: string;
  startTime: Date;
  ani: string;
  abandoned: boolean;
  businessDay: string;
}

export interface InteractionRecord {
  id: string;
  startTime: Date;
  direction: string;
  durationMs: number;
}

export interface CustomerSummaryRow {
  businessDay: string;
  offered: number;
  answered: number;
  abandoned: number;
  uniqueTotal: number;
  uniqueAnswered: number;
  uniqueAbandoned: number;
  recovered: number;
  lost: number;
}

export interface LostCustomerRow {
  businessDay: string;
  mobileNumber: string;
  calledBackAgain: 'YES' | 'NO';
  callbackDate: string;
  callbackTime: string;
}

export interface AgentPerformance {
  userId: string;
  name: string;
  answered: number;
  missed: number; // Alerts that were not answered
  handleTimeMs: number;
  firstActivity: Date | null;
  lastActivity: Date | null;
}

export interface WrapUpData {
  name: string;
  count: number;
}

export interface BranchData {
  name: string;
  offered: number;
  answered: number;
  abandoned: number;
  slPercent: number | null;
}

export interface ReasonBranchData {
  branch: string;
  reason: string;
  count: number;
}

export interface CallerData {
  number: string;
  count: number;
}

export interface MOSDataPoint {
  timestamp: string;
  mos: number;
  conversationsCount: number;
}

export interface Alert {
  id: string;
  timestamp: string;
  value: number;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export enum Region {
  UAE = 'mec1.pure.cloud',
  US_EAST = 'mypurecloud.com'
}

export interface GenesysCredentials {
  clientId: string;
  clientSecret: string;
  orgName: string;
  region: Region;
  proxyUrl?: string;
  manualToken?: string;
}

/** Planner Specific Types */
export interface ForecastInterval {
  hour: number;
  dayOfWeek: number;
  requiredAgents: number;
  avgCalls: number;
  avgAht: number;
}

export interface ForecastData {
  intervals: ForecastInterval[];
  generatedAt: string;
}
