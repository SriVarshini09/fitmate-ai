/**
 * Step Detection Algorithm
 * Uses device accelerometer data to detect steps
 */

export interface AccelerometerData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

export interface StepDetectionConfig {
  threshold: number; // Minimum acceleration magnitude to count as step
  minTimeBetweenSteps: number; // Minimum ms between steps (prevents double counting)
  smoothingWindow: number; // Number of samples to smooth
}

const DEFAULT_CONFIG: StepDetectionConfig = {
  threshold: 1.3, // g-force threshold
  minTimeBetweenSteps: 200, // 200ms = max 300 steps/min
  smoothingWindow: 3,
};

export class StepDetector {
  private config: StepDetectionConfig;
  private lastStepTime: number = 0;
  private stepCount: number = 0;
  private accelerationHistory: number[] = [];
  private isAboveThreshold: boolean = false;

  constructor(config: Partial<StepDetectionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Calculate magnitude of acceleration vector
   */
  private calculateMagnitude(data: AccelerometerData): number {
    return Math.sqrt(data.x * data.x + data.y * data.y + data.z * data.z);
  }

  /**
   * Apply smoothing to reduce noise
   */
  private getSmoothedMagnitude(magnitude: number): number {
    this.accelerationHistory.push(magnitude);
    if (this.accelerationHistory.length > this.config.smoothingWindow) {
      this.accelerationHistory.shift();
    }
    return this.accelerationHistory.reduce((a, b) => a + b, 0) / this.accelerationHistory.length;
  }

  /**
   * Process accelerometer data and detect steps
   */
  processData(data: AccelerometerData): { stepDetected: boolean; totalSteps: number } {
    const magnitude = this.calculateMagnitude(data);
    const smoothedMagnitude = this.getSmoothedMagnitude(magnitude);
    
    // Detect peak (step) using threshold crossing
    const currentTime = data.timestamp;
    const timeSinceLastStep = currentTime - this.lastStepTime;
    
    let stepDetected = false;

    // Rising edge detection
    if (smoothedMagnitude > this.config.threshold && !this.isAboveThreshold) {
      // Check minimum time between steps
      if (timeSinceLastStep >= this.config.minTimeBetweenSteps) {
        this.stepCount++;
        this.lastStepTime = currentTime;
        stepDetected = true;
      }
      this.isAboveThreshold = true;
    } else if (smoothedMagnitude <= this.config.threshold) {
      this.isAboveThreshold = false;
    }

    return {
      stepDetected,
      totalSteps: this.stepCount,
    };
  }

  /**
   * Reset step counter
   */
  reset(): void {
    this.stepCount = 0;
    this.lastStepTime = 0;
    this.accelerationHistory = [];
    this.isAboveThreshold = false;
  }

  /**
   * Get current step count
   */
  getStepCount(): number {
    return this.stepCount;
  }

  /**
   * Set step count (for calibration or loading saved data)
   */
  setStepCount(count: number): void {
    this.stepCount = count;
  }
}

/**
 * Check if device supports motion sensors
 */
export function isMotionSensorSupported(): boolean {
  return typeof DeviceMotionEvent !== 'undefined' && 
         typeof DeviceMotionEvent.requestPermission !== 'function' || 
         'ondevicemotion' in window;
}

/**
 * Request permission for motion sensors (iOS 13+)
 */
export async function requestMotionPermission(): Promise<boolean> {
  if (typeof DeviceMotionEvent !== 'undefined' && 
      typeof (DeviceMotionEvent as any).requestPermission === 'function') {
    try {
      const permission = await (DeviceMotionEvent as any).requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting motion permission:', error);
      return false;
    }
  }
  // Permission not needed on Android or older iOS
  return isMotionSensorSupported();
}

/**
 * Estimate distance from steps (average stride length)
 */
export function estimateDistance(steps: number, heightCm: number = 170): number {
  // Average stride length is approximately 0.413 * height
  const strideLengthMeters = (heightCm * 0.00413);
  const distanceMeters = steps * strideLengthMeters;
  return distanceMeters / 1000; // Convert to km
}

/**
 * Estimate calories burned from steps
 */
export function estimateCaloriesFromSteps(steps: number, weightKg: number = 70): number {
  // Rough estimate: 0.04 calories per step per kg of body weight
  return Math.round(steps * 0.04 * (weightKg / 70));
}
