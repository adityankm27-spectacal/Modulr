/**
 * Attendance maths (spec §5.3). With `a` attended of `t` total and target `p`:
 *   below target: need n = ceil((p·t − a) / (1 − p)) consecutive lectures
 *   at/above target: can miss m = floor(a/p − t) lectures and stay at target
 */
export const DEFAULT_ATTENDANCE_TARGET = 0.75;

export type AttendanceStatus =
  | { kind: "no_lectures"; percentage: null }
  | { kind: "below_target"; percentage: number; lecturesNeeded: number }
  | { kind: "on_track"; percentage: number; safeToMiss: number };

// Guards against floating-point noise, e.g. 0.75 * 4 - 3 = 4.4e-16 rather than 0.
const EPSILON = 1e-9;

export function attendanceStatus(
  attended: number,
  total: number,
  target: number = DEFAULT_ATTENDANCE_TARGET,
): AttendanceStatus {
  if (!Number.isInteger(attended) || !Number.isInteger(total) || attended < 0 || total < 0) {
    throw new RangeError("attended and total must be non-negative integers");
  }
  if (attended > total) throw new RangeError("attended cannot exceed total");
  if (!(target > 0 && target < 1)) throw new RangeError("target must be between 0 and 1");

  if (total === 0) return { kind: "no_lectures", percentage: null };

  const percentage = (attended / total) * 100;
  if (attended / total < target - EPSILON) {
    const lecturesNeeded = Math.ceil((target * total - attended) / (1 - target) - EPSILON);
    return { kind: "below_target", percentage, lecturesNeeded };
  }
  const safeToMiss = Math.max(0, Math.floor(attended / target - total + EPSILON));
  return { kind: "on_track", percentage, safeToMiss };
}
