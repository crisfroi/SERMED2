// Utility to suppress known Recharts deprecation warnings that don't affect functionality
// These warnings are from the Recharts library itself and will be fixed in future versions

export const suppressRechartsWarnings = () => {
  // Store the original console methods
  const originalWarn = console.warn;
  const originalError = console.error;

  // List of Recharts components that use defaultProps
  const rechartsComponents = [
    'XAxis', 'YAxis', 'XAxis2', 'YAxis2', 'CartesianGrid', 'Tooltip', 'ResponsiveContainer',
    'BarChart', 'LineChart', 'PieChart', 'Pie', 'Bar', 'Line', 'Cell', 'Legend',
    'Surface', 'ChartLayoutContextProvider2', 'CategoricalChartWrapper'
  ];

  // Override console.warn to filter out Recharts defaultProps warnings
  console.warn = (...args: any[]) => {
    const firstArg = args[0];
    const secondArg = args[1];

    // React warning format: "%s: Support for defaultProps will be removed...", componentName
    if (typeof firstArg === 'string' &&
        firstArg.includes('%s: Support for defaultProps will be removed from function components') &&
        typeof secondArg === 'string' &&
        rechartsComponents.includes(secondArg)) {
      return; // Suppress this specific warning pattern
    }

    // Also check other patterns for safety
    const message = args.join(' ');
    if (typeof firstArg === 'string' && (
        (firstArg.includes('Support for defaultProps will be removed') &&
         rechartsComponents.some(component => message.includes(component))) ||
        (message.includes('Support for defaultProps will be removed from function components') &&
         rechartsComponents.some(component => message.includes(component)))
    )) {
      return; // Don't log these warnings
    }

    // Log all other warnings normally
    originalWarn.apply(console, args);
  };

  // Override console.error to filter out related errors if any
  console.error = (...args: any[]) => {
    const message = args.join(' ');

    // Filter out any related Recharts errors
    if (message.includes('defaultProps') &&
        rechartsComponents.some(component => message.includes(component))) {
      return; // Don't log these errors
    }

    // Log all other errors normally
    originalError.apply(console, args);
  };

  if (import.meta.env.DEV) {
    console.log('🔇 Suppressed Recharts defaultProps warnings (functionality not affected)');
  }
};

// Only suppress in development
if (import.meta.env.DEV) {
  suppressRechartsWarnings();
}
