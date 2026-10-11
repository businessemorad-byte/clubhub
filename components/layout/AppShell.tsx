"use client";

import React, { useState } from "react";
import { IconRail } from "./IconRail";
import { ChannelSidebar } from "./ChannelSidebar";
import { Menu, X } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#313338] text-[#dbdee1]">
      {/* Desktop Navigation: IconRail + ChannelSidebar */}
      <div className="hidden md:flex flex-shrink-0 h-full">
        <IconRail />
        <ChannelSidebar />
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer Menu */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex md:hidden transform transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <IconRail />
        <ChannelSidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        {/* Mobile top toggle bar */}
        <div className="md:hidden h-12 bg-[#2b2d31] border-b border-[#1e1f22] px-4 flex items-center justify-between">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1 text-[#dbdee1] hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <span className="font-semibold text-white text-sm">ClubHub</span>
          <div className="w-6" />
        </div>

        {children}
      </div>
    </div>
  );
}
