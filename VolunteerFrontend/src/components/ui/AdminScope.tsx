import { createContext, useContext } from 'react';

/** True inside the admin shell. Portalled UI (Modal, ConfirmDialog) reads it to pick the admin skin. */
export const AdminScopeContext = createContext(false);
export const useAdminScope = () => useContext(AdminScopeContext);
