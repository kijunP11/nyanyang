/**
 * Character Wizard Context
 *
 * React Context + useReducer for 5-step wizard state management.
 */
import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";

import {
  WIZARD_STEPS,
  initialFormData,
  type CharacterFormData,
  type WizardAction,
  type WizardState,
  type WizardStep,
} from "./wizard-types";

/**
 * Initial Wizard State
 */
const initialWizardState: WizardState = {
  currentStep: WIZARD_STEPS.PROFILE,
  formData: initialFormData,
  isDirty: false,
  errors: {},
  characterId: null,
  isEditMode: false,
  isSavingDraft: false,
};

/**
 * Wizard Reducer
 */
function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SET_STEP":
      return {
        ...state,
        currentStep: action.payload,
      };

    case "NEXT_STEP":
      return {
        ...state,
        currentStep: Math.min(
          state.currentStep + 1,
          WIZARD_STEPS.PUBLISHING
        ) as WizardStep,
      };

    case "PREV_STEP":
      return {
        ...state,
        currentStep: Math.max(
          state.currentStep - 1,
          WIZARD_STEPS.PROFILE
        ) as WizardStep,
      };

    case "UPDATE_FIELD":
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.payload.field]: action.payload.value,
        },
        isDirty: true,
        errors: {
          ...state.errors,
          [action.payload.field]: undefined,
        },
      };

    case "UPDATE_FIELDS":
      return {
        ...state,
        formData: {
          ...state.formData,
          ...action.payload,
        },
        isDirty: true,
      };

    case "SET_FORM_DATA":
      return {
        ...state,
        formData: {
          ...state.formData,
          ...action.payload,
        },
      };

    case "SET_ERRORS":
      return {
        ...state,
        errors: action.payload,
      };

    case "CLEAR_ERRORS":
      return {
        ...state,
        errors: {},
      };

    case "RESET_FORM":
      return {
        ...initialWizardState,
      };

    case "SET_EDIT_MODE":
      return {
        ...state,
        isEditMode: true,
        characterId: action.payload.characterId,
        formData: {
          ...state.formData,
          ...action.payload.data,
        },
      };

    case "SET_CHARACTER_ID":
      return {
        ...state,
        characterId: action.payload,
      };

    case "SET_SAVING_DRAFT":
      return {
        ...state,
        isSavingDraft: action.payload,
      };

    case "ADD_EXAMPLE_DIALOGUE":
      return {
        ...state,
        formData: {
          ...state.formData,
          example_dialogues: [
            ...state.formData.example_dialogues,
            action.payload,
          ],
        },
        isDirty: true,
      };

    case "UPDATE_EXAMPLE_DIALOGUE":
      return {
        ...state,
        formData: {
          ...state.formData,
          example_dialogues: state.formData.example_dialogues.map((d) =>
            d.id === action.payload.id ? { ...d, ...action.payload.data } : d
          ),
        },
        isDirty: true,
      };

    case "REMOVE_EXAMPLE_DIALOGUE":
      return {
        ...state,
        formData: {
          ...state.formData,
          example_dialogues: state.formData.example_dialogues.filter(
            (d) => d.id !== action.payload
          ),
        },
        isDirty: true,
      };

    default:
      return state;
  }
}

/**
 * Context Types
 */
interface WizardContextType {
  state: WizardState;
  dispatch: Dispatch<WizardAction>;
}

/**
 * Create Context
 */
const WizardContext = createContext<WizardContextType | null>(null);

/**
 * Wizard Provider Props
 */
interface WizardProviderProps {
  children: ReactNode;
  initialData?: Partial<CharacterFormData>;
  characterId?: number;
}

/**
 * Wizard Provider Component
 */
export function WizardProvider({
  children,
  initialData,
  characterId,
}: WizardProviderProps) {
  const [state, dispatch] = useReducer(wizardReducer, {
    ...initialWizardState,
    isEditMode: !!characterId,
    characterId: characterId ?? null,
    formData: {
      ...initialFormData,
      ...initialData,
    },
  });

  return (
    <WizardContext.Provider value={{ state, dispatch }}>
      {children}
    </WizardContext.Provider>
  );
}

/**
 * Hook to use Wizard Context
 */
export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("useWizard must be used within a WizardProvider");
  }
  return context;
}
