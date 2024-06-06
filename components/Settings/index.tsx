"use client";

import * as React from "react";
import { useState, useEffect, useRef } from "react";
import { FiSettings } from "react-icons/fi";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Accordion } from "@/components/ui/accordion";
import { useSettings } from "@/components/Settings/context";
import Sessions from "./sessions";
import Appearance from "./appearance";
import Notifications from "./notifications";
import Sounds from "./sounds";
import { Text } from "@/components/ui/text";
import Layout from "./layout";

export const Settings = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { pendingSettings, saveSettings } = useSettings();
  const backdropRef = useRef(null);
  const { setTheme } = useTheme();

  // Toggle settings modal visibility
  const toggleSettings = () => setIsOpen(prevIsOpen => !prevIsOpen);

  // Handle backdrop clicks to close modal
  const handleBackdropClick = (event: any) => {
    event.target === backdropRef.current && toggleSettings();
  };

  // Attach and detach event listener for backdrop clicks
  useEffect(() => {
    document.addEventListener("click", handleBackdropClick);
    return () => document.removeEventListener("click", handleBackdropClick);
  }, []);

  // Save changes and apply theme
  const handleSaveChanges = async () => {
    saveSettings();
    setTheme(pendingSettings.theme);
    toggleSettings();
  };

  return (
    <>
      {/* Settings button */}
      <Button variant="ghost" size="icon" onClick={toggleSettings}>
        <FiSettings className="icon" />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            ref={backdropRef}
            className="fixed inset-0 opacity-70 z-40 bg-black"
            onClick={handleBackdropClick}
          ></div>

          {/* Settings modal */}
          <div className="fixed z-50 inset-0 flex items-center justify-center">
            <div className="bg-midnight-100 dark:bg-midnight-900 w-[85vw] h-[80vh] rounded-md border border-input overflow-hidden flex flex-col relative">
              <div className="flex-1 overflow-auto">
                <Accordion type="single" collapsible className="w-full px-4">
                  <Appearance />
                  <Sessions />
                  <Notifications />
                  <Sounds />
                  <Layout />
                </Accordion>
              </div>
              <Button className="ml-auto absolute bottom-0 right-0 m-4" variant="outline" onClick={handleSaveChanges}>Save Changes</Button>
            </div>
          </div>
        </>
      )}
    </>
  );
};
