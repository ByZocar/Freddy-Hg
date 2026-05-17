/**
 * ☿ FREDDY Hg — Organization context
 * Por ahora deriva una org "placeholder" del usuario logueado.
 * Cuando exista una tabla `org_members` en Supabase, este hook lee de allí.
 */
import { useMemo } from 'react';
import type { User } from '@supabase/supabase-js';

export interface OrganizationInfo {
  name: string;
  shortName: string;
  type: 'CAR' | 'ONG' | 'FISCALIA' | 'INVESTIGACION';
  role: string;
}

export function useOrganization(user: User | null): OrganizationInfo {
  return useMemo(() => {
    const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
    const orgName = (meta.organization_name as string | undefined) ?? 'Corpoamazonía';
    const orgType = (meta.organization_type as OrganizationInfo['type'] | undefined) ?? 'CAR';
    const role = (meta.role as string | undefined) ?? 'Control Ambiental';

    return {
      name: orgName,
      shortName: orgName.split(' ')[0],
      type: orgType,
      role,
    };
  }, [user]);
}
