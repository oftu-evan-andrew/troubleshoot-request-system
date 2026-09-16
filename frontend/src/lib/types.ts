export type ReporterRole = "Student" | "Faculty" | "Staff";

export type RequestPriority = "Low" | "Normal" | "High" | "Exam";

export type RequestStatus = "Pending" | "InProgress" | "Resolved" | "Cancelled";

export type ComputerUnitStatus = "Operational" | "UnderMaintenance" | "OutOfService";

export interface ComputerUnitDto {
  id: number;
  assetTag: string;
  status: ComputerUnitStatus;
  currentSeatId: number | null;
  currentSeatLabel: string | null;
}

export interface SeatDto {
  id: number;
  labId: number;
  seatNumber: string;
  currentUnit: ComputerUnitDto | null;
}

export interface LabDto {
  id: number;
  labName: string;
  location: string;
  seats: SeatDto[];
}

export interface RequestDto {
  id: number;
  reporterName: string;
  reporterRole: ReporterRole;
  reporterId: string;
  seatId: number;
  seatNumber: string;
  labName: string;
  unitId: number | null;
  unitAssetTag: string | null;
  issueDescription: string;
  priority: RequestPriority;
  status: RequestStatus;
  timeSubmitted: string;
  timeResolved: string | null;
  resolvedById: string | null;
  resolvedByName: string | null;
}

export interface SubmitRequestDto {
  reporterName: string;
  reporterRole: ReporterRole;
  reporterId: string;
  seatId: number;
  issueDescription: string;
  priority: RequestPriority;
}

export interface StaffSummary {
  id: string;
  name: string;
  email: string;
}

export interface LoginResponse {
  token: string;
  staff: StaffSummary;
}
