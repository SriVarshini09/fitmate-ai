import { useState, useEffect, useRef, useCallback } from 'react';
import { StepDetector, requestMotionPermission, isMotionSensorSupported, estimateDistance, estimateCaloriesFromSteps } from '@/lib/stepDetection';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

const STEPS_KEY = 'Cals Crumble Fit_steps';
const SYNC_INTERVAL = 5 * 60 * 1000; // Sync every 5 minutes

interface StepData {
  date: string;
  steps: number;
  distance: number;
  calories: number;
  source: 'sensor' | 'manual' | 'imported';
  synced: boolean;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useStepTracker(userWeight: number = 70, userHeight: number = 170) {
  const { user } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [steps, setSteps] = useState(0);
  const [distance, setDistance] = useState(0);
  const [calories, setCalories] = useState(0);
  
  const detectorRef = useRef<StepDetector | null>(null);
  const syncTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSyncRef = useRef<number>(0);

  // Initialize detector
  useEffect(() => {
    detectorRef.current = new StepDetector();
    setIsSupported(isMotionSensorSupported());
    
    // Load today's steps from localStorage
    loadTodaySteps();
  }, []);

  // Load steps from localStorage
  const loadTodaySteps = useCallback(() => {
    try {
      const raw = localStorage.getItem(STEPS_KEY);
      if (!raw) return;
      const data: Record<string, StepData> = JSON.parse(raw);
      const today = todayISO();
      if (data[today]) {
        setSteps(data[today].steps);
        setDistance(data[today].distance);
        setCalories(data[today].calories);
        if (detectorRef.current) {
          detectorRef.current.setStepCount(data[today].steps);
        }
      }
    } catch {
      // ignore localStorage read errors
    }
  }, []);

  // Save steps to localStorage
  const saveSteps = useCallback((stepCount: number, source: 'sensor' | 'manual' | 'imported' = 'sensor') => {
    try {
      const raw = localStorage.getItem(STEPS_KEY);
      const data: Record<string, StepData> = raw ? JSON.parse(raw) : {};
      const today = todayISO();
      
      const dist = estimateDistance(stepCount, userHeight);
      const cals = estimateCaloriesFromSteps(stepCount, userWeight);
      
      data[today] = {
        date: today,
        steps: stepCount,
        distance: dist,
        calories: cals,
        source,
        synced: false,
      };
      
      localStorage.setItem(STEPS_KEY, JSON.stringify(data));
      setSteps(stepCount);
      setDistance(dist);
      setCalories(cals);
    } catch {
      // ignore localStorage write errors
    }
  }, [userWeight, userHeight]);

  // Sync to Supabase
  const syncToSupabase = useCallback(async () => {
    if (!user) return;
    
    try {
      const raw = localStorage.getItem(STEPS_KEY);
      if (!raw) return;
      
      const data: Record<string, StepData> = JSON.parse(raw);
      const today = todayISO();
      const todayData = data[today];
      
      if (!todayData || todayData.synced) return;
      
      const stepsGoal = (() => {
        try {
          const ob = JSON.parse(localStorage.getItem('Cals Crumble Fit_onboarding') || '{}');
          return parseInt(ob.stepsGoal) || 10000;
        } catch { return 10000; }
      })();
      await supabase.from('steps_logs').upsert({
        user_id: user.id,
        steps: todayData.steps,
        goal: stepsGoal,
        logged_date: today,
      }, { onConflict: 'user_id,logged_date' });
      
      // Mark as synced
      todayData.synced = true;
      localStorage.setItem(STEPS_KEY, JSON.stringify(data));
      lastSyncRef.current = Date.now();
    } catch {
      // ignore sync errors - will retry on next sync
    }
  }, [user]);

  // Request permission and start tracking
  const startTracking = useCallback(async () => {
    if (!isSupported) {
      return false;
    }

    const granted = await requestMotionPermission();
    setHasPermission(granted);
    
    if (!granted) {
      return false;
    }

    setIsTracking(true);
    
    // Set up motion event listener
    const handleMotion = (event: DeviceMotionEvent) => {
      if (!event.accelerationIncludingGravity) return;
      
      const { x, y, z } = event.accelerationIncludingGravity;
      if (x === null || y === null || z === null) return;
      
      const result = detectorRef.current?.processData({
        x,
        y,
        z,
        timestamp: Date.now(),
      });
      
      if (result?.stepDetected) {
        saveSteps(result.totalSteps, 'sensor');
      }
    };

    window.addEventListener('devicemotion', handleMotion);
    
    // Set up periodic sync
    syncTimerRef.current = setInterval(() => {
      syncToSupabase();
    }, SYNC_INTERVAL);
    
    // Initial sync
    syncToSupabase();
    
    return true;
  }, [isSupported, saveSteps, syncToSupabase]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    setIsTracking(false);
    
    // Remove event listener
    window.removeEventListener('devicemotion', () => {});
    
    // Clear sync timer
    if (syncTimerRef.current) {
      clearInterval(syncTimerRef.current);
      syncTimerRef.current = null;
    }
    
    // Final sync
    syncToSupabase();
  }, [syncToSupabase]);

  // Manual step update
  const updateSteps = useCallback((stepCount: number) => {
    if (detectorRef.current) {
      detectorRef.current.setStepCount(stepCount);
    }
    saveSteps(stepCount, 'manual');
  }, [saveSteps]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isTracking) {
        stopTracking();
      }
    };
  }, [isTracking, stopTracking]);

  return {
    isSupported,
    hasPermission,
    isTracking,
    steps,
    distance,
    calories,
    startTracking,
    stopTracking,
    updateSteps,
  };
}
