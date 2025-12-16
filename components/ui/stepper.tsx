// Temporary placeholder - @stepperize/react package is not installed
// This file exports minimal types to prevent build errors
// If stepper functionality is needed, install @stepperize/react package

import * as React from "react";

namespace Stepper {
  export type StepperVariant = "horizontal" | "vertical" | "circle";
  export type StepperLabelOrientation = "horizontal" | "vertical";

  export type ConfigProps = {
    variant?: StepperVariant;
    labelOrientation?: StepperLabelOrientation;
    tracking?: boolean;
  };

  export type DefineProps<Steps extends any[]> = {
    Stepper: {
      Provider: React.ComponentType<any>;
      Navigation: React.ComponentType<any>;
      Step: React.ComponentType<any>;
      Title: React.ComponentType<any>;
      Description: React.ComponentType<any>;
      Panel: React.ComponentType<any>;
      Controls: React.ComponentType<any>;
    };
  };

  export type CircleStepIndicatorProps = {
    currentStep: number;
    totalSteps: number;
    size?: number;
    strokeWidth?: number;
  };
}

const defineStepper = <const Steps extends any[]>(
  ...steps: Steps
): Stepper.DefineProps<Steps> => {
  // Placeholder implementation
  const StepperProvider: React.ComponentType<any> = () => null;
  const StepperNavigation: React.ComponentType<any> = () => null;
  const StepperStep: React.ComponentType<any> = () => null;
  const StepperTitle: React.ComponentType<any> = () => null;
  const StepperDescription: React.ComponentType<any> = () => null;
  const StepperPanel: React.ComponentType<any> = () => null;
  const StepperControls: React.ComponentType<any> = () => null;

  return {
    Stepper: {
      Provider: StepperProvider,
      Navigation: StepperNavigation,
      Step: StepperStep,
      Title: StepperTitle,
      Description: StepperDescription,
      Panel: StepperPanel,
      Controls: StepperControls,
    },
  };
};

export { defineStepper };
