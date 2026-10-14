import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth, User } from '../contexts/AuthContext';
import { ShieldAlert } from 'lucide-react-native';

export type UserRole = NonNullable<User['tipoUsuario']>;

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
  showAccessDeniedMessage?: boolean;
}

/**
 * Componente de controle de acesso baseado em papéis (RBAC - RC07)
 * Bloqueia a exibição de recursos administrativos ou pedagógicos para usuários sem permissão
 */
export function RoleGuard({
  allowedRoles,
  children,
  fallback = null,
  showAccessDeniedMessage = false,
}: RoleGuardProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user || !user.tipoUsuario) {
    if (showAccessDeniedMessage) {
      return (
        <View style={styles.deniedContainer}>
          <ShieldAlert size={32} color="#EF4444" />
          <Text style={styles.deniedText}>Acesso restrito a usuários autorizados.</Text>
        </View>
      );
    }
    return <>{fallback}</>;
  }

  const hasPermission = allowedRoles.includes(user.tipoUsuario);

  if (!hasPermission) {
    if (showAccessDeniedMessage) {
      return (
        <View style={styles.deniedContainer}>
          <ShieldAlert size={32} color="#EF4444" />
          <Text style={styles.deniedText}>
            Você não possui permissão para acessar esta funcionalidade.
          </Text>
        </View>
      );
    }
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Hook para verificação direta de papéis (RBAC)
 */
export function useRoleCheck() {
  const { user } = useAuth();

  const isRole = (...roles: UserRole[]) => {
    if (!user || !user.tipoUsuario) return false;
    return roles.includes(user.tipoUsuario);
  };

  return {
    isAluno: user?.tipoUsuario === 'ALUNO',
    isProfessor: user?.tipoUsuario === 'PROFESSOR',
    isAdmin: user?.tipoUsuario === 'ADMINISTRADOR' || user?.tipoUsuario === 'OWNER',
    isOwner: user?.tipoUsuario === 'OWNER',
    hasRole: isRole,
  };
}

const styles = StyleSheet.create({
  deniedContainer: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    alignItems: 'center',
    gap: 8,
    marginVertical: 12,
  },
  deniedText: {
    color: '#991B1B',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default RoleGuard;
