import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from 'better-auth/plugins/organization/access'

export const ac = createAccessControl(
    defaultStatements,
)

export const admin = ac.newRole(
    adminAc.statements
); 