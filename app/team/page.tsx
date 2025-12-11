"use client";

import { TeamSphere } from "@/components/team-sphere"
import { TeamIntroAnimation } from "@/components/team-intro-animation"
import { useState } from "react"

export default function Team() {
  const [showIntro, setShowIntro] = useState(true);

  const handleAnimationComplete = () => {
    setShowIntro(false);
  };

  if (showIntro) {
    return <TeamIntroAnimation onComplete={handleAnimationComplete} />;
  }

  return <TeamSphere />
}
