"use client";

interface ViewerContainerProps {
  children: React.ReactNode;
}

export function ViewerContainer({ children }: ViewerContainerProps) {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-muted">
      {children}
    </div>
  );
}
