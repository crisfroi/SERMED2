import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export const AuthDebug: React.FC = () => {
  const { data: authTest, refetch: testAuth, isLoading } = useQuery({
    queryKey: ['auth-debug'],
    queryFn: async () => {
      console.log('🔍 Running auth debug test...');
      
      const results: any = {
        timestamp: new Date().toISOString(),
        tests: {}
      };
      
      try {
        // Test 1: Get current user
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
        results.tests.currentUser = {
          success: !userError,
          data: currentUser ? { id: currentUser.id, email: currentUser.email } : null,
          error: userError?.message || null
        };
        
        // Test 2: Try to access user_profiles table
        if (currentUser) {
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();
            
          results.tests.userProfile = {
            success: !profileError,
            data: profileData,
            error: profileError?.message || profileError?.code || null,
            errorDetails: profileError
          };
          
          // Test 3: Try to query all profiles (to test admin access)
          const { data: allProfiles, error: allProfilesError } = await supabase
            .from('user_profiles')
            .select('*')
            .limit(5);
            
          results.tests.allProfiles = {
            success: !allProfilesError,
            count: allProfiles?.length || 0,
            error: allProfilesError?.message || allProfilesError?.code || null
          };
          
          // Test 4: Try to create a profile if none exists
          if (profileError && profileError.code === 'PGRST116') {
            const { data: insertData, error: insertError } = await supabase
              .from('user_profiles')
              .insert({
                id: currentUser.id,
                email: currentUser.email || '',
                full_name: 'Test User',
                role: 'SUPER_ADMINISTRADOR',
                department: 'Test Department',
                is_active: true
              })
              .select()
              .single();
              
            results.tests.createProfile = {
              success: !insertError,
              data: insertData,
              error: insertError?.message || insertError?.code || null,
              errorDetails: insertError
            };
          }
        } else {
          results.tests.userProfile = {
            success: false,
            error: 'No current user found'
          };
        }
        
      } catch (error: any) {
        results.tests.generalError = {
          success: false,
          error: error.message || 'Unknown error',
          details: error
        };
      }
      
      console.log('🔍 Auth debug results:', results);
      return results;
    },
    enabled: false // Only run when manually triggered
  });

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>🔍 Authentication Debug</CardTitle>
        <CardDescription>
          Test authentication and user profile access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={() => testAuth()} disabled={isLoading}>
          {isLoading ? 'Testing...' : 'Run Auth Debug Test'}
        </Button>
        
        {authTest && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Last test: {new Date(authTest.timestamp).toLocaleString()}
            </div>
            
            <div className="space-y-2">
              {Object.entries(authTest.tests).map(([testName, result]: [string, any]) => (
                <div key={testName} className="border rounded p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">{testName}</span>
                    <span className={`text-sm px-2 py-1 rounded ${
                      result.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {result.success ? 'SUCCESS' : 'FAILED'}
                    </span>
                  </div>
                  
                  {result.error && (
                    <div className="text-sm text-red-600 mb-2">
                      Error: {result.error}
                    </div>
                  )}
                  
                  {result.data && (
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  )}
                  
                  {result.errorDetails && (
                    <details className="mt-2">
                      <summary className="text-sm cursor-pointer text-gray-600">Error Details</summary>
                      <pre className="text-xs bg-red-50 p-2 rounded overflow-auto mt-1">
                        {JSON.stringify(result.errorDetails, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
