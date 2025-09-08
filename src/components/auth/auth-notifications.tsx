"use client";

import { useAuthNotifications } from "@/hooks/use-auth-notifications";

export default function AuthNotifications() {
  useAuthNotifications();
  return null; // This component doesn't render anything, just handles notifications
}