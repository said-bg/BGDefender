import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { User, UserPlan, UserRole } from '../../entities/user.entity';

interface SeedUserDefinition {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: UserRole;
  plan: UserPlan;
}

const userDefinitions: SeedUserDefinition[] = [
  {
    email: 'admin@bgdefender.com',
    firstName: 'Admin',
    lastName: 'User',
    password: 'Admin123!',
    role: UserRole.ADMIN,
    plan: UserPlan.PREMIUM,
  },
  {
    email: 'user@bgdefender.com',
    firstName: 'Free',
    lastName: 'User',
    password: 'User123!',
    role: UserRole.USER,
    plan: UserPlan.FREE,
  },
  {
    email: 'premium@bgdefender.com',
    firstName: 'Premium',
    lastName: 'User',
    password: 'Premium123!',
    role: UserRole.USER,
    plan: UserPlan.PREMIUM,
  },
];

export async function seedUsers(dataSource: DataSource): Promise<void> {
  const verboseLogging = process.env.SEED_VERBOSE_LOGS === 'true';

  try {
    const userRepository = dataSource.getRepository(User);

    for (const definition of userDefinitions) {
      let user = await userRepository.findOne({
        where: { email: definition.email },
      });

      const hashedPassword = await bcrypt.hash(definition.password, 10);

      if (!user) {
        user = userRepository.create({
          email: definition.email,
          firstName: definition.firstName,
          lastName: definition.lastName,
          password: hashedPassword,
          role: definition.role,
          plan: definition.plan,
          isActive: true,
        });
        await userRepository.save(user);
        if (verboseLogging) {
          console.log(`[SEED] Created user "${definition.email}"`);
        }
      } else {
        // Update existing user (except password and email)
        Object.assign(user, {
          firstName: definition.firstName,
          lastName: definition.lastName,
          role: definition.role,
          plan: definition.plan,
          isActive: true,
        });
        await userRepository.save(user);
        if (verboseLogging) {
          console.log(`[SEED] Updated user "${definition.email}"`);
        }
      }
    }

    console.log('[SEED] Users seeding completed successfully');
  } catch (error) {
    console.error('[SEED] Error seeding users:', error);
    throw error;
  }
}
