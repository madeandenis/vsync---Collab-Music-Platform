"use client";

import { UserProvider } from "../../contexts/userContext";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <main>
      <UserProvider>
        {children}
      </UserProvider>
    </main>
  )
}