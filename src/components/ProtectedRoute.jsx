import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

let cachedUserRole = localStorage.getItem('surgilink_user_role');

export default function ProtectedRoute({ children, requiredRole }) {
    const [isLoading, setIsLoading] = useState(true);
    const [session, setSession] = useState(null);
    const [userRole, setUserRole] = useState(() => cachedUserRole);

    useEffect(() => {
        let isMounted = true;

        const checkAuth = async () => {
            try {
                let currentSession = null;
                try {
                    // Maximum 1.5s timeout so ProtectedRoute never hangs on "Chargement sécurisé..."
                    const sessionPromise = supabase.auth.getSession();
                    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve({ data: { session: null } }), 1500));
                    const { data } = await Promise.race([sessionPromise, timeoutPromise]);
                    currentSession = data?.session || null;
                } catch (e) {
                    console.log('Supabase session get error:', e);
                }

                const demoSessionStr = localStorage.getItem('surgilink_demo_session');
                if (!currentSession && demoSessionStr) {
                    try {
                        const parsed = JSON.parse(demoSessionStr);
                        currentSession = { user: parsed.user };
                        const role = parsed.role || 'practitioner';
                        cachedUserRole = role;
                        localStorage.setItem('surgilink_user_role', role);
                        if (isMounted) setUserRole(role);
                    } catch (e) {}
                }

                if (!isMounted) return;
                setSession(currentSession);

                if (currentSession) {
                    const email = currentSession.user?.email?.toLowerCase() || '';
                    const defaultRole = (email.includes('infirmier') || email.includes('nurse')) ? 'nurse' : 'practitioner';
                    if (!userRole) {
                        const initialRole = cachedUserRole || defaultRole;
                        setUserRole(initialRole);
                    }

                    // Non-blocking async profile role check
                    if (currentSession.user?.id && currentSession.user.id !== 'demo-practitioner-id') {
                        supabase
                            .from('profiles')
                            .select('role')
                            .eq('id', currentSession.user.id)
                            .maybeSingle()
                            .then(({ data: profile }) => {
                                if (isMounted && profile?.role) {
                                    cachedUserRole = profile.role;
                                    localStorage.setItem('surgilink_user_role', profile.role);
                                    setUserRole(profile.role);
                                }
                            })
                            .catch(() => {});
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
