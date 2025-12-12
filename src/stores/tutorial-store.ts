import create from "zustand";

type TutorialStep = "home" | "koamas" | "breathing" | "faru" | "done";

type TutorialState = {
  isTutorialActive: boolean;
  step: TutorialStep;
  startTutorial: () => void;
  nextStep: () => void;
  skipTutorial: () => void;
};

export const useTutorialStore = create<TutorialState>((set) => ({
  isTutorialActive: false,
  step: "home",
  startTutorial: () => set({ isTutorialActive: true, step: "home" }),
  nextStep: () => {
    set((state) => {
      const steps: TutorialStep[] = ["home", "koamas", "breathing", "faru", "done"];
      const currentIndex = steps.indexOf(state.step);
      const nextIndex = currentIndex + 1;
      
      if (nextIndex >= steps.length) {
        // Tutorial complete
        return { isTutorialActive: false, step: "done" };
      }
      
      return { step: steps[nextIndex] };
    });
  },
  skipTutorial: () => set({ isTutorialActive: false, step: "done" }),
}));

