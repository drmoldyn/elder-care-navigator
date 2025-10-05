import { MATCH_STEPS, NavigatorStep, SessionContext } from "@/types/domain";

export const NAVIGATOR_STEPS: NavigatorStep[] = [...MATCH_STEPS];

export interface NavigatorState {
  step: NavigatorStep;
  completedSteps: Set<NavigatorStep>;
  session: SessionContext;
}

export const isLastStep = (step: NavigatorStep) =>
  NAVIGATOR_STEPS[NAVIGATOR_STEPS.length - 1] === step;

export const getNextStep = (step: NavigatorStep): NavigatorStep => {
  const currentIndex = NAVIGATOR_STEPS.indexOf(step);
  return NAVIGATOR_STEPS[Math.min(currentIndex + 1, NAVIGATOR_STEPS.length - 1)];
};

export const getPreviousStep = (step: NavigatorStep): NavigatorStep => {
  const currentIndex = NAVIGATOR_STEPS.indexOf(step);
  return NAVIGATOR_STEPS[Math.max(currentIndex - 1, 0)];
};

export const createInitialNavigatorState = (
  defaults?: Partial<SessionContext>
): NavigatorState => ({
  step: NAVIGATOR_STEPS[0],
  completedSteps: new Set<NavigatorStep>(),
  session: {
    conditions: [],
    urgencyFactors: [],
    ...defaults,
  },
});
