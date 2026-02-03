"use client";

import { createContext, useContext } from "react";

type AddDeviceDialogContextValue = {
  openDialog: () => void;
};

const AddDeviceDialogContext = createContext<AddDeviceDialogContextValue | null>(
  null,
);

export function AddDeviceDialogProvider({
  children,
  openDialog,
}: {
  children: React.ReactNode;
  openDialog: () => void;
}) {
  return (
    <AddDeviceDialogContext.Provider value={{ openDialog }}>
      {children}
    </AddDeviceDialogContext.Provider>
  );
}

export function useAddDeviceDialog() {
  const context = useContext(AddDeviceDialogContext);
  if (!context) {
    throw new Error(
      "useAddDeviceDialog must be used within AddDeviceDialogProvider",
    );
  }
  return context;
}
