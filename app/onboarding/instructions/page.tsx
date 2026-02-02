"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Download,
  UserPlus,
  Smartphone,
  Key,
  Wifi,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const steps = [
  {
    number: 1,
    title: "Create Qingping+ Account",
    description: "Sign up for a Qingping+ account if you don't have one already.",
    icon: UserPlus,
    details: [
      "Go to the Qingping+ website or download the mobile app",
      "Create a new account with your email address",
      "Verify your email address",
    ],
  },
  {
    number: 2,
    title: "Download Qingping+ App",
    description: "Install the official Qingping+ mobile app on your device.",
    icon: Download,
    details: [
      "Download from App Store (iOS) or Google Play Store (Android)",
      "Open the app and log in with your Qingping+ account",
    ],
  },
  {
    number: 3,
    title: "Add Your Device",
    description: "Follow the in-app instructions to add your Qingping sensor device.",
    icon: Smartphone,
    details: [
      "Open the Qingping+ app",
      "Follow the device setup wizard",
      "Connect your device to WiFi",
      "Complete the device registration",
    ],
  },
  {
    number: 4,
    title: "Create Developer Account",
    description:
      "Create a developer account using the SAME credentials as your Qingping+ account.",
    icon: Key,
    details: [
      "Go to the Qingping Developer Platform",
      "Use the SAME email and password as your Qingping+ account",
      "Complete the developer account registration",
    ],
    link: "https://developer.cleargrass.com",
  },
  {
    number: 5,
    title: "Get App Key & Secret",
    description: "Retrieve your API credentials from the developer platform.",
    icon: Key,
    details: [
      "Log in to the Qingping Developer Platform",
      "Navigate to 'Developer Information Management'",
      "Copy your App Key and App Secret",
      "Keep these credentials secure - you'll need them in the next step",
    ],
  },
  {
    number: 6,
    title: "Add Credentials to Dashboard",
    description: "Enter your App Key and App Secret in this dashboard.",
    icon: CheckCircle2,
    details: [
      "Click 'Continue' below to proceed to the next step",
      "Enter your App Key and App Secret when prompted",
      "Your devices will be automatically synced",
    ],
  },
  {
    number: 7,
    title: "Get Device MAC Address",
    description: "Find your device's WiFi MAC address from the Qingping+ app.",
    icon: Wifi,
    details: [
      "Open the Qingping+ app",
      "Go to your device settings",
      "Find the WiFi MAC address (usually shown as 'MAC' or 'Device ID')",
      "Copy the MAC address (format: XX:XX:XX:XX:XX:XX or XXXXXXXXXXXX)",
    ],
  },
  {
    number: 8,
    title: "Add Device in Dashboard",
    description: "Add your device using the MAC address in the dashboard.",
    icon: CheckCircle2,
    details: [
      "Go to your dashboard",
      "Click 'Add Device'",
      "Enter the MAC address you copied",
      "Your device will be connected and start showing readings",
    ],
  },
];

export default function OnboardingInstructionsPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  useEffect(() => {
    if (isLoaded && userId) {
      // User is logged in, they can proceed to onboarding
    }
  }, [isLoaded, userId]);

  const handleNext = () => {
    if (currentStep < steps.length - 1 && !isAnimating) {
      setDirection("forward");
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setTimeout(() => setIsAnimating(false), 50);
      }, 200);
    }
  };

  const handleBack = () => {
    if (currentStep > 0 && !isAnimating) {
      setDirection("backward");
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setTimeout(() => setIsAnimating(false), 50);
      }, 200);
    }
  };

  const handleStepClick = (index: number) => {
    if (index !== currentStep && !isAnimating) {
      setDirection(index > currentStep ? "forward" : "backward");
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(index);
        setTimeout(() => setIsAnimating(false), 50);
      }, 200);
    }
  };

  const handleDone = () => {
    if (userId) {
      router.push("/onboarding/connect");
    } else {
      router.push("/login");
    }
  };

  const step = steps[currentStep];
  const Icon = step.icon;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Setup Guide
            </h1>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Follow these steps to connect your Qingping devices to the dashboard
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Step {currentStep + 1} of {steps.length}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Step Indicator */}
          <div className="mb-8 flex items-center justify-center gap-2 overflow-x-auto pb-4">
            {steps.map((s, index) => (
              <div key={s.number} className="flex items-center gap-2">
                <button
                  onClick={() => handleStepClick(index)}
                  disabled={isAnimating}
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 disabled:cursor-not-allowed",
                    index === currentStep
                      ? "border-emerald-500 bg-emerald-500 text-white scale-110 shadow-lg"
                      : index < currentStep
                        ? "border-emerald-500 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 hover:scale-105"
                        : "border-slate-300 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-800 hover:border-slate-400",
                  )}
                >
                  {index < currentStep ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{s.number}</span>
                  )}
                </button>
                {index < steps.length - 1 && (
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors duration-300",
                      index < currentStep
                        ? "text-emerald-500"
                        : "text-slate-300 dark:text-slate-700",
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="relative min-h-[400px] overflow-hidden">
            <div
              key={currentStep}
              className={cn(
                "step-content transition-all duration-500 ease-in-out",
                isAnimating
                  ? direction === "forward"
                    ? "opacity-0 translate-x-8"
                    : "opacity-0 -translate-x-8"
                  : "opacity-100 translate-x-0",
              )}
            >
              <Card className="border-2 border-emerald-200 shadow-lg dark:border-emerald-900">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30 transition-transform duration-300 hover:scale-110">
                      <Icon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <div className="mb-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        Step {step.number}
                      </div>
                      <CardTitle className="text-2xl">{step.title}</CardTitle>
                      <CardDescription className="mt-2 text-base">
                        {step.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pl-20">
                  <ul className="space-y-3">
                    {step.details.map((detail, detailIndex) => (
                      <li
                        key={detailIndex}
                        className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400"
                        style={{
                          animation: `fadeInUp 0.4s ease-out ${detailIndex * 100}ms both`,
                        }}
                      >
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span className="leading-relaxed">{detail}</span>
                      </li>
                    ))}
                  </ul>
                  {step.link && (
                    <a
                      href={step.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-6 inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-600 transition-all hover:bg-emerald-100 hover:scale-105 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
                    >
                      Visit Developer Platform
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isFirstStep || isAnimating}
              className="gap-2 transition-all hover:scale-105 disabled:scale-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            {isLastStep ? (
              <Button
                onClick={handleDone}
                size="lg"
                className="gap-2 bg-emerald-600 transition-all hover:bg-emerald-700 hover:scale-105"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                size="lg"
                disabled={isAnimating}
                className="gap-2 bg-emerald-600 transition-all hover:bg-emerald-700 hover:scale-105 disabled:scale-100"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .step-content {
          will-change: transform, opacity;
        }
      `}</style>
    </>
  );
}
