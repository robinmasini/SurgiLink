import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function ProtectedRoute({ children, requiredRole }) {
    const [isLoading, setIsLoading] = useState(true);
    const [session, setSession] = useState(null);
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        let mounted = true;

        const checkAuth = async () => {
            try {
                const { data: { session: currentSession } } = await supabase.auth.getSession();
                if (!mounted) return;

                setSession(currentSession);

                if (currentSession) {
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', currentSession.user.id)
                        .single();

                    if (!profileError && profile && mounted) {
                        setUserRole(profile.role);
                    }
                }
            } catch (err) {
                console.error('Auth check error:', err);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) {
                setSession(session);
                if (!session) {
                    setUserRole(null);
                    setIsLoading(false);
                } else {
                    checkAuth();
                }
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    if (isLoading) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#F8F9FB',
                color: '#7C3AED',
                fontSize: '1.2rem',
                fontWeight: 500
            }}>
                Chargement sécurisé...
            </div>
        );
    }

    if (!session) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && userRole && userRole !== requiredRole) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}
