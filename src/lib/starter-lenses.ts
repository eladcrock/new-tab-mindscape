// Starter lens pack used in anonymous (local-only) mode and as fallback
export type Lens = {
  id: string;
  name: string;
  theme: string;
  prompts: string[];
  enabled: boolean;
  is_starter: boolean;
};

export const STARTER_LENSES: Lens[] = [
  { id: "s1", name: "Lens of Surprise", theme: "novelty", prompts: ["What in your work could surprise someone today?", "When was the last time something surprised YOU about your project?"], enabled: true, is_starter: true },
  { id: "s2", name: "Lens of Fun", theme: "joy", prompts: ["What about this is genuinely fun for you?", "If this stopped being fun, what would you change first?"], enabled: true, is_starter: true },
  { id: "s3", name: "Lens of Curiosity", theme: "inquiry", prompts: ["What question are you most curious about right now?", "What would you explore if no one was watching?"], enabled: true, is_starter: true },
  { id: "s4", name: "Lens of the Essential Experience", theme: "core", prompts: ["What is the one feeling you want someone to walk away with?", "Strip everything away — what remains?"], enabled: true, is_starter: true },
  { id: "s5", name: "Lens of the Problem Statement", theme: "clarity", prompts: ["What problem are you really solving?", "Could you say it in one sentence?"], enabled: true, is_starter: true },
  { id: "s6", name: "Lens of Endogenous Value", theme: "meaning", prompts: ["What inside this work matters to you, regardless of outcome?", "Which part would you do even unpaid?"], enabled: true, is_starter: true },
  { id: "s7", name: "Lens of the Beginner's Mind", theme: "fresh-eyes", prompts: ["How would someone seeing this for the first time react?", "What assumption are you carrying that you should drop?"], enabled: true, is_starter: true },
  { id: "s8", name: "Lens of Constraint", theme: "limits", prompts: ["What constraint, if added, would force a more interesting choice?", "What are you avoiding because it feels limiting?"], enabled: true, is_starter: true },
  { id: "s9", name: "Lens of Resonance", theme: "connection", prompts: ["What part of this resonates most deeply with you, and why?", "Who else needs to hear this?"], enabled: true, is_starter: true },
  { id: "s10", name: "Lens of Pacing", theme: "rhythm", prompts: ["Are you moving too fast, too slow, or just right?", "Where in your week do you feel most alive?"], enabled: true, is_starter: true },
  { id: "s11", name: "Lens of Risk", theme: "courage", prompts: ["What is the smallest risk you could take today?", "What are you not doing because of fear?"], enabled: true, is_starter: true },
  { id: "s12", name: "Lens of Reflection", theme: "meta", prompts: ["What did past-you not know that present-you knows now?", "What would future-you thank you for doing today?"], enabled: true, is_starter: true },
];
