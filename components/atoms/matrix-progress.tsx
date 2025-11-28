"use client"

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}

interface MatrixProgressProps {
  value: number; // 0-100
  className?: string;
  showPercentage?: boolean;
  animated?: boolean;
}

export function MatrixProgress({ 
  value, 
  className, 
  showPercentage = true,
  animated = true 
}: MatrixProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  
  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative w-full h-3 bg-black/50 border border-green-500/30 rounded-sm overflow-hidden">
        <div 
          className={cn(
            "h-full bg-linear-to-r from-green-500 to-green-400 transition-all duration-300 ease-out",
            animated && "matrix-glow-subtle",
            "relative overflow-hidden"
          )}
          style={{ width: `${clampedValue}%` }}
        >
          {/* Matrix-style scanning effect */}
          <div 
            className={cn(
              "absolute inset-0 bg-linear-to-r from-transparent via-green-300/50 to-transparent",
              "animate-pulse",
              animated && clampedValue > 0 && clampedValue < 100 ? "opacity-100" : "opacity-0"
            )}
          />
        </div>
      </div>
      
      {showPercentage && (
        <div className="flex justify-between text-xs font-mono text-green-400">
          <span>PROCESSING...</span>
          <span>{clampedValue.toFixed(0)}%</span>
        </div>
      )}
    </div>
  );
}