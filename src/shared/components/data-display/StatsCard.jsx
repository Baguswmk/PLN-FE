import React, { useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { formatWeight } from "@/shared/utils/formaters";

const colorConfig = {
  primary: {
    icon: "text-primary",
    text: "text-foreground",
    bg: "bg-primary/10",
    border: "border-border",
    gradient: "from-primary/50 to-primary",
  },
  secondary: {
    icon: "text-secondary-foreground",
    text: "text-foreground",
    bg: "bg-secondary",
    border: "border-border",
    gradient: "from-secondary to-secondary/50",
  },
  destructive: {
    icon: "text-destructive",
    text: "text-foreground",
    bg: "bg-destructive/10",
    border: "border-destructive/20",
    gradient: "from-destructive/50 to-destructive",
  },
  muted: {
    icon: "text-muted-foreground",
    text: "text-foreground",
    bg: "bg-muted",
    border: "border-border",
    gradient: "from-muted to-muted/50",
  },
  accent: {
    icon: "text-accent-foreground",
    text: "text-foreground",
    bg: "bg-accent",
    border: "border-border",
    gradient: "from-accent to-accent/50",
  },
  green: {
    icon: "text-green-600 dark:text-green-400",
    text: "text-foreground",
    bg: "bg-green-100 dark:bg-green-900/30",
    border: "border-border",
    gradient: "from-green-500 to-green-600",
  },
  amber: {
    icon: "text-amber-600 dark:text-amber-400",
    text: "text-foreground",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    border: "border-border",
    gradient: "from-amber-500 to-amber-600",
  },
};

const sizeConfig = {
  compact: {
    card: "p-3",
    header: "pb-2",
    title: "text-xs",
    icon: "h-3 w-3",
    iconContainer: "p-1.5",
    value: "text-lg",
    unit: "text-xs",
    spacing: "space-y-2",
  },
  default: {
    card: "p-4",
    header: "pb-3",
    title: "text-sm",
    icon: "h-4 w-4",
    iconContainer: "p-1",
    value: "text-xl",
    unit: "text-sm",
    spacing: "space-y-3",
  },
  large: {
    card: "p-6",
    header: "pb-4",
    title: "text-base",
    icon: "h-5 w-5",
    iconContainer: "p-2.5",
    value: "text-xl",
    unit: "text-base",
    spacing: "space-y-4",
  },
};

const LoadingSkeleton = React.memo(({ sizeStyles, className }) => (
  <Card className={`relative overflow-hidden ${className}`}>
    <CardContent className={sizeStyles.card}>
      <div className="animate-pulse space-y-3">
        <div className="flex justify-between items-center">
          <div className="h-4 bg-muted rounded w-24"></div>
          <div className="h-8 w-8 bg-muted rounded-full"></div>
        </div>
        <div className="h-8 bg-muted rounded w-32"></div>
        <div className="h-3 bg-muted rounded w-20"></div>
      </div>
    </CardContent>
  </Card>
));

const BreakdownSection = React.memo(({ breakdown, unit }) => {
  if (!breakdown) return null;

  // Jika semua properti breakdown kosong/undefined (seperti di FOT yang di-bypass) hide section
  const hasBongkar =
    breakdown.bongkar !== undefined && breakdown.bongkar !== null;
  const hasIntransit =
    breakdown.intransit !== undefined && breakdown.intransit !== null;

  if (!hasBongkar && !hasIntransit) return null;

  return (
    <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
      <div className="grid grid-cols-1 gap-2 text-xs">
        {hasBongkar && (
          <div className="flex justify-between items-center px-2 py-1 bg-gray-50 dark:bg-gray-700 rounded transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-600">
            <span className="text-gray-600 dark:text-gray-300 font-medium">
              Bongkar
            </span>
            <div className="flex flex-row text-right gap-2">
              <div className="font-semibold text-gray-900 dark:text-gray-100">
                {formatWeight(breakdown.bongkar)} {unit.toLowerCase()}
              </div>
              <div className="text-gray-500 dark:text-gray-400">
                {Number(breakdown.finishedCount) || 0} ritase
              </div>
            </div>
          </div>
        )}
        {hasIntransit && (
          <div className="flex justify-between items-center px-2 py-1 bg-gray-50 dark:bg-gray-700 rounded transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-600">
            <span className="text-gray-600 dark:text-gray-300 font-medium">
              Intransit
            </span>
            <div className="flex flex-row text-right gap-2">
              <div className="font-semibold text-gray-900 dark:text-gray-100">
                {formatWeight(breakdown.intransit)} {unit.toLowerCase()}
              </div>
              <div className="text-gray-500 dark:text-gray-400">
                {Number(breakdown.intransitCount) || 0} ritase
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

const CoalTypeSection = React.memo(({ coalType, unit }) => {
  if (!coalType) return null;

  const crushedTonnage = useMemo(
    () =>
      (Array.isArray(coalType) && coalType[0]?.totalTonnage) ||
      coalType?.crushed ||
      0,
    [coalType],
  );

  const crushedCount = useMemo(
    () =>
      (Array.isArray(coalType) && coalType[0]?.crushedRitase) ||
      coalType?.crushedRitase ||
      0,
    [coalType],
  );

  const uncrushedTonnage = useMemo(
    () =>
      (Array.isArray(coalType) && coalType[1]?.totalTonnage) ||
      coalType?.uncrushed ||
      0,
    [coalType],
  );

  const uncrushedCount = useMemo(
    () =>
      (Array.isArray(coalType) && coalType[1]?.uncrushedRitase) ||
      coalType?.uncrushedRitase ||
      0,
    [coalType],
  );

  return (
    <div className="pt-2 border-t space-y-2">
      <div className="grid grid-cols-1 gap-2 text-xs">
        <div className="flex justify-between items-center px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded transition-colors duration-150">
          <span className="text-green-700 dark:text-green-400 font-medium">
            Crushed
          </span>
          <div className="flex flex-row gap-2 text-right">
            <div className="font-semibold text-green-800 dark:text-green-300">
              {formatWeight(crushedTonnage)} {unit.toLowerCase()}
            </div>
            <div className="text-green-600 dark:text-green-500">
              {crushedCount} ritase
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded transition-colors duration-150">
          <span className="text-amber-700 dark:text-amber-400 font-medium">
            Uncrushed
          </span>
          <div className="flex flex-row gap-2 text-right">
            <div className="font-semibold text-amber-800 dark:text-amber-300">
              {formatWeight(uncrushedTonnage)} {unit.toLowerCase()}
            </div>
            <div className="text-amber-600 dark:text-amber-500">
              {uncrushedCount} ritase
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export const StatsCard = React.memo(
  ({
    title,
    value,
    icon: Icon,
    color = "blue",
    percentage,
    breakdown = null,
    isLoading = false,
    className = "",
    coalType,
    ritase = null,
    unit = "Ton",
    size = "default",
    variant = "default",
    showGradient = true,
    customColors = null,
  }) => {
    const colors = useMemo(
      () => customColors || colorConfig[color] || colorConfig.primary,
      [customColors, color],
    );
    const sizeStyles = useMemo(
      () => sizeConfig[size] || sizeConfig.default,
      [size],
    );
    const formattedValue = useMemo(() => formatWeight(value), [value]);
    const ritaseCount = useMemo(() => Number(ritase) || 0, [ritase]);

    if (isLoading) {
      return <LoadingSkeleton sizeStyles={sizeStyles} className={className} />;
    }

    return (
      <Card
        className={`
      relative overflow-hidden transition-all duration-300 ease-in-out rounded-xl  
      ${colors.border} hover:shadow-lg hover:scale-[1.02] transform
      ${variant === "minimal" ? "shadow-sm" : "shadow-md"}
      ${className}
    `}
      >
        {/* Header */}
        <CardHeader
          className={`flex flex-row items-center justify-between ${sizeStyles.header}`}
        >
          <CardTitle
            className={`font-semibold tracking-wide text-muted-foreground ${sizeStyles.title} transition-colors duration-200`}
          >
            {title}
          </CardTitle>
          <div
            className={`
          ${sizeStyles.iconContainer} rounded-full ${colors.bg} dark:bg-gray-700 shadow-sm 
          transition-all duration-200 hover:shadow-md hover:scale-110 transform
        `}
          >
            <Icon
              className={`${sizeStyles.icon} ${colors.icon} dark:text-gray-300 transition-colors duration-200`}
            />
          </div>
        </CardHeader>

        {/* Main Content */}
        <CardContent
          className={`${sizeStyles.spacing} ${sizeStyles.card} pt-0`}
        >
          {/* Primary Value */}
          <div className="flex flex-row items-center justify-between gap-2">
            <div
              className={`font-bold ${colors.text} ${sizeStyles.value} flex items-baseline gap-2`}
            >
              <span className="transition-all duration-200">
                {formattedValue}
              </span>
              <span
                className={`font-normal text-muted-foreground ${sizeStyles.unit}`}
              >
                {unit}
              </span>
            </div>

            {/* Secondary metrics */}
            <div className="flex flex-col gap-2 text-sm">
              {ritase !== null && (
                <div className="flex flex-row items-center gap-1 text-muted-foreground transition-colors duration-200">
                  <span className="font-medium">{ritaseCount}</span>
                  <span>(Ritase)</span>
                </div>
              )}
              {percentage !== undefined && (
                <div className="flex flex-row items-center text-muted-foreground gap-1 transition-colors duration-200">
                  <span className="font-medium">{percentage}%</span>
                  <span>dari total</span>
                </div>
              )}
            </div>
          </div>

          {/* Detailed sections */}
          {variant !== "minimal" && (
            <>
              <BreakdownSection breakdown={breakdown} unit={unit} />
              <CoalTypeSection coalType={coalType} unit={unit} />
            </>
          )}
        </CardContent>

        {/* Gradient Bottom  */}
        {showGradient && (
          <div
            className={`
          absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r ${colors.gradient} 
          opacity-80 transition-opacity duration-200
        `}
          />
        )}
      </Card>
    );
  },
);
