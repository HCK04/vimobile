// Centralized authentication redirect logic
// Used by both patient and professional auth screens to ensure consistent routing

export type UserRole = {
  role_name?: string;
  role_id?: number;
  role?: { name?: string };
};

/**
 * Determines the correct route after authentication based on user role
 * @param user - User object with role information
 * @param category - Optional category from registration (professionnel_sante or organisation)
 * @returns Route path as string
 */
export function getPostAuthRoute(user: UserRole, category?: string): string {
  // Extract role information from various possible structures
  const roleName = user?.role?.name || user?.role_name || '';
  const roleId = user?.role_id;

  // Define role buckets
  const professionalRoles = ['medecin', 'doctor', 'kine', 'orthophoniste', 'psychologue'];
  const professionalRoleIds = [2, 3, 4, 5, 6];
  
  const organizationRoles = ['clinique', 'pharmacie', 'parapharmacie', 'labo_analyse', 'centre_radiologie'];
  const organizationRoleIds = [7, 8, 9, 10, 11];

  // Check if user is a professional (by name or ID or category)
  const isProfessional = 
    professionalRoles.includes(roleName.toLowerCase()) ||
    professionalRoleIds.includes(Number(roleId)) ||
    category === 'professionnel_sante';

  // Check if user is an organization (by name or ID or category)
  const isOrganization = 
    organizationRoles.includes(roleName.toLowerCase()) ||
    organizationRoleIds.includes(Number(roleId)) ||
    category === 'organisation';

  // Route to professional dashboard if pro or org
  if (isProfessional || isOrganization) {
    return '/doctor/dashboard';
  }

  // Check if user is a patient (by name or ID)
  const isPatient = roleName.toLowerCase() === 'patient' || Number(roleId) === 1;
  if (isPatient) {
    return '/(tabs)/profil';
  }

  // Default fallback to home
  return '/(tabs)/accueil';
}

/**
 * Determines if a user is a professional or organization
 * @param user - User object with role information
 * @returns boolean
 */
export function isProfessionalOrOrg(user: UserRole): boolean {
  const roleName = user?.role?.name || user?.role_name || '';
  const roleId = user?.role_id;

  const professionalRoles = ['medecin', 'doctor', 'kine', 'orthophoniste', 'psychologue'];
  const professionalRoleIds = [2, 3, 4, 5, 6];
  
  const organizationRoles = ['clinique', 'pharmacie', 'parapharmacie', 'labo_analyse', 'centre_radiologie'];
  const organizationRoleIds = [7, 8, 9, 10, 11];

  return (
    professionalRoles.includes(roleName.toLowerCase()) ||
    professionalRoleIds.includes(Number(roleId)) ||
    organizationRoles.includes(roleName.toLowerCase()) ||
    organizationRoleIds.includes(Number(roleId))
  );
}
