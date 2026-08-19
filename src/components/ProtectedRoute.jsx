import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function ProtectedRoute({ children, requiredRole }) {
    const [isLoading, setIsLoading] = useState(true);
    const [session, setSession] = useState(null);
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const checkAuth = async () => {
            try {
                let currentSession = null;
                try {
                    const { data } = await supabase.auth.getSession();
                    currentSession = data?.session || null;
                } catch (e) {
                    console.log('Supabase session get error:', e);
                }

                const demoSessionStr = localStorage.getItem('surgilink_demo_session');
                if (!currentSession && demoSessionStr) {
                    try {
                        const parsed = JSON.parse(demoSessionStr);
                        currentSession = { user: parsed.user };
                        if (isMounted) setUserRole(parsed.role || 'practitioner');
                    } catch (e) {}
                }

                if (!isMounted) return;
                setSession(currentSession);

                if (currentSession && currentSession.user?.id !== 'demo-practitioner-id') {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', currentSession.user.id)
                        .single();

                    if (isMounted) {
                        if (profile) {
                            setUserRole(profile.role);
                        } else {
                            const email = currentSession.user.email?.toLowerCase() || '';
                            if (email.includes('infirmier') || email.includes('nurse')) {
                                setUserRole('nurse');
                            } else {
                                setUserRole('practitioner');
                            }
                        }
                    }
                }
            } catch (err) {
                console.error('Auth check error:', err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!isMounted) return;
            setSession(session);
            if (!session) {
                setUserRole(null);
            } else {
                checkAuth();
            }
        });

        return () => {
            isMounted = false;
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
                background: 'var(--color-gray-50)',
                color: 'var(--color-primary-600)',
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

    if (requiredRole && userRole !== requiredRole) {
        // Redirect to dashboard if they don't have the required role
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}
