import { faker } from "@faker-js/faker/locale/fr";
import {
  CheckCircle2,
  CircleIcon,
  CircleX,
  Shield,
  UserX,
} from "lucide-react";
import { type User } from "@/db/schema";

import { generateId } from "@/lib/data-table/id";

export function generateRandomUser(): User {
  const roles = ["admin", "user", "moderator", null];
  const randomRole = faker.helpers.arrayElement(roles);

  return {
    id: generateId("user"),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    emailVerified: faker.datatype.boolean({ probability: 0.7 }),
    image: faker.datatype.boolean({ probability: 0.3 }) ? faker.image.avatar() : null,
    role: randomRole,
    banned: faker.datatype.boolean({ probability: 0.1 }),
    banReason: null,
    banExpires: null,
    createdAt: faker.date.past(),
    updatedAt: new Date(),
  };
}

export function getBannedStatusIcon(banned: boolean | null) {
  if (banned) {
    return UserX;
  }
  return CheckCircle2;
}

export function getEmailVerifiedIcon(emailVerified: boolean) {
  if (emailVerified) {
    return CheckCircle2;
  }
  return CircleX;
}

export function getRoleIcon(role: string | null) {
  if (role === "admin") {
    return Shield;
  }
  return CircleIcon;
}