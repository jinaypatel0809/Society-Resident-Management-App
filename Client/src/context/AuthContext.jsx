import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

// Separate storage keys per role so an admin tab and a user tab — even in
// the same browser — don't overwrite each other's session.
const STORAGE_KEY = {
  admin: "society_admin_session",
  user:  "society_user_session",
};

// Which "side" a tab belongs to is determined by its current URL, not a
// single global flag — this is what lets one tab stay logged in as admin
// while another tab is logged in as a resident.
const roleForPath = (pathname) => (pathname.startsWith("/admin") ? "admin" : "user");

function readSession(role) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY[role]);
    return stored ? JSON.parse(stored) : null;
  } catch {
    localStorage.removeItem(STORAGE_KEY[role]);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [role, setRole]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialRole = roleForPath(window.location.pathname);
    const session = readSession(initialRole);
    if (session) {
      setUser(session.user);
      setRole(session.role);
    }
    setLoading(false);

    // If the same role's session changes in another tab (login/logout there),
    // reflect it here too — without this, a tab can keep using a stale token.
    const onStorage = (e) => {
      if (e.key !== STORAGE_KEY[initialRole]) return;
      if (!e.newValue) {
        setUser(null);
        setRole(null);
      } else {
        try {
          const updated = JSON.parse(e.newValue);
          setUser(updated.user);
          setRole(updated.role);
        } catch {}
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = (userData, userRole, token) => {
    localStorage.setItem(
      STORAGE_KEY[userRole],
      JSON.stringify({ user: userData, role: userRole, token })
    );
    setUser(userData);
    setRole(userRole);
  };

  // Patch the current session's user object (e.g. after a Settings update)
  // without forcing a re-login — keeps the stored token, just refreshes data.
  const updateUser = (patch) => {
    if (!role) return;
    setUser((prev) => {
      const updated = { ...prev, ...patch };
      try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY[role]));
        localStorage.setItem(STORAGE_KEY[role], JSON.stringify({ ...stored, user: updated }));
      } catch {}
      return updated;
    });
  };

  const logout = () => {
    if (role) localStorage.removeItem(STORAGE_KEY[role]);
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}