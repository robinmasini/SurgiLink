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
                const { data: { session } } = await supabase.auth.getSession();
                if (!isMounted) return;

                setSession(session);

                if (session) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', session.user.id)
                        .single();

                    if (isMounted && profile) {
                        setUserRole(profile.role);
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
