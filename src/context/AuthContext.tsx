import React, { createContext, useContext, useState, useEffect } from 'react';
import { Member, UserRole, MembershipStatus } from '../types';
import { repository } from '../lib/storage';

interface AuthContextType {
  currentUser: Member | null;
  role: UserRole;
  status: MembershipStatus | null;
  isVisitor: boolean;
  isPending: boolean;
  isApproved: boolean;
  isAdmin: boolean;
  isMemberLoginOpen: boolean;
  setIsMemberLoginOpen: (open: boolean) => void;
  loginAs: (targetIdOrRole: string) => void;
  loginWithCredentials: (usernameOrEmail: string, passwordInput: string) => Promise<{ success: boolean; member?: Member; error?: string; role?: UserRole; isPending?: boolean }>;
  logout: () => void;
  register: (data: Omit<Member, 'id' | 'role' | 'status' | 'joinedAt'> & { phone?: string; username?: string; password?: string }) => Promise<{ success: boolean; member?: Member; error?: string }>;
  updateConsents: (consents: { consentDirectoryDisplay?: boolean; consentPhotoPublish?: boolean; consentFutureCommunications?: boolean }) => boolean;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [isMemberLoginOpen, setIsMemberLoginOpen] = useState(false);

  const loadUser = async () => {
    const activeId = repository.getActiveUserId();
    if (!activeId || activeId === 'visitor') {
      setCurrentUser(null);
    } else {
      let member = repository.getMemberById(activeId);
      if (!member) {
        // Fetch specific member by ID directly from server (works for pending and approved)
        member = await repository.fetchMemberById(activeId);
      }
      if (member) {
        setCurrentUser(member);
      } else {
        setCurrentUser(null);
      }
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const loginWithCredentials = async (usernameOrEmail: string, passwordInput: string) => {
    const result = await repository.loginWithCredentialsAsync(usernameOrEmail, passwordInput);
    if (result.success && result.member) {
      setCurrentUser(result.member);
    }
    return result;
  };

  const loginAs = (targetIdOrRole: string) => {
    if (targetIdOrRole === 'visitor') {
      repository.setActiveUserId('visitor');
      setCurrentUser(null);
      return;
    }

    if (targetIdOrRole === 'admin') {
      const admin = repository.getMembers().find(m => m.role === 'administrator');
      if (admin) {
        repository.setActiveUserId(admin.id);
        setCurrentUser(admin);
      }
      return;
    }

    if (targetIdOrRole === 'pending') {
      const pending = repository.getMembers().find(m => m.status === 'pending');
      if (pending) {
        repository.setActiveUserId(pending.id);
        setCurrentUser(pending);
      }
      return;
    }

    if (targetIdOrRole === 'approved') {
      const approved = repository.getMembers().find(m => m.role === 'approved_member' && m.consentPhotoPublish);
      if (approved) {
        repository.setActiveUserId(approved.id);
        setCurrentUser(approved);
      }
      return;
    }

    if (targetIdOrRole === 'opt_out_photo') {
      const optOut = repository.getMembers().find(m => m.status === 'approved' && !m.consentPhotoPublish);
      if (optOut) {
        repository.setActiveUserId(optOut.id);
        setCurrentUser(optOut);
      }
      return;
    }

    const member = repository.getMemberById(targetIdOrRole);
    if (member) {
      repository.setActiveUserId(member.id);
      setCurrentUser(member);
    }
  };

  const logout = () => {
    repository.setActiveUserId('visitor');
    setCurrentUser(null);
  };

  const register = async (data: Omit<Member, 'id' | 'role' | 'status' | 'joinedAt'> & { phone?: string; username?: string; password?: string }) => {
    const res = await repository.registerMemberAsync(data);
    if (res.success && res.member) {
      repository.setActiveUserId(res.member.id);
      setCurrentUser(res.member);
    }
    return res;
  };

  const updateConsents = (consents: { consentDirectoryDisplay?: boolean; consentPhotoPublish?: boolean; consentFutureCommunications?: boolean }) => {
    if (!currentUser) return false;
    const ok = repository.updateMemberConsents(currentUser.id, consents);
    if (ok) {
      loadUser();
    }
    return ok;
  };

  const refreshUser = () => {
    loadUser();
  };

  const role: UserRole = currentUser ? currentUser.role : 'visitor';
  const status: MembershipStatus | null = currentUser ? currentUser.status : null;
  const isVisitor = role === 'visitor';
  const isPending = role === 'pending_member' || status === 'pending';
  const isApproved = role === 'approved_member' || (status === 'approved' && role !== 'visitor');
  const isAdmin = role === 'administrator' || currentUser?.professionalEmail?.toLowerCase() === 'ashrafgalalsalem@gmail.com';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        status,
        isVisitor,
        isPending,
        isApproved,
        isAdmin,
        isMemberLoginOpen,
        setIsMemberLoginOpen,
        loginAs,
        loginWithCredentials,
        logout,
        register,
        updateConsents,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
