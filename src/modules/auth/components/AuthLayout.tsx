import React from "react";

export const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex">
      {/* Left side */}
      <div className="hidden md:block w-1/2 bg-background-sidebar rounded-r-[32px]"></div>

      {/* Right side - Form */}
      <div className="flex flex-1 justify-center items-center px-6 py-10">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
};
 