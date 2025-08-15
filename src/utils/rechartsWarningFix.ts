// Enhanced Recharts warning suppression
// This suppresses the specific "%s: Support for defaultProps will be removed" warnings from Recharts

if (typeof window !== 'undefined' && import.meta.env.DEV) {
  const originalConsoleWarn = console.warn;
  
  console.warn = function(...args) {
    // Pattern: "%s: Support for defaultProps will be removed from function components in a future major release. Use JavaScript default parameters instead.%s", "XAxis"
    if (args.length >= 2 && 
        typeof args[0] === 'string' &&
        typeof args[1] === 'string' &&
        args[0].includes('Support for defaultProps will be removed from function components') &&
        (args[1] === 'XAxis' || args[1] === 'YAxis' || args[1] === 'CartesianGrid' || 
         args[1] === 'Tooltip' || args[1] === 'ResponsiveContainer' || args[1] === 'BarChart' ||
         args[1] === 'LineChart' || args[1] === 'PieChart' || args[1] === 'Bar' || 
         args[1] === 'Line' || args[1] === 'Cell' || args[1] === 'Legend')) {
      // This is a Recharts defaultProps warning - suppress it
      return;
    }
    
    // For all other warnings, use the original console.warn
    originalConsoleWarn.apply(console, args);
  };
  
  console.log('🔇 Enhanced Recharts warning suppression active');
}

export {};
