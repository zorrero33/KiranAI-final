import crypto from 'crypto';
import { Database } from './db/database.ts';
import { type UserEntity, type PlanTier } from './db/types.ts';

export { type UserEntity };

export class UserStore {
  private static instance: UserStore;
  private db: Database;
  private sessions: Map<string, { userId: string; expiresAt: number }> = new Map();

  private constructor() {
    this.db = Database.getInstance();
  }

  public static getInstance(): UserStore {
    if (!UserStore.instance) {
      UserStore.instance = new UserStore();
    }
    return UserStore.instance;
  }

  private generateToken(userId: string): string {
    const token = `kir_${crypto.randomBytes(24).toString('hex')}`;
    this.sessions.set(token, {
      userId,
      expiresAt: Date.now() + 86400000 * 30, // 30 days
    });
    return token;
  }

  public verifySessionToken(token: string): string | null {
    const session = this.sessions.get(token);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(token);
      return null;
    }
    return session.userId;
  }

  public register(params: { email: string; password?: string; name?: string }): {
    user: Omit<UserEntity, 'passwordHash'>;
    token: string;
  } {
    const cleanEmail = params.email.toLowerCase().trim();
    if (!cleanEmail.includes('@')) {
      throw new Error('Dirección de correo electrónico inválida.');
    }

    if (params.password && params.password.length < 6) {
      throw new Error('La contraseña debe contener al menos 6 caracteres.');
    }

    const created = this.db.createUser({
      email: cleanEmail,
      password: params.password,
      name: params.name,
      role: cleanEmail === 'muhammaddris.dd@gmail.com' ? 'admin' : 'user',
    });

    const token = this.generateToken(created.id);
    const { passwordHash, ...safe } = created;
    return { user: safe, token };
  }

  public loginWithPassword(
    email: string,
    password?: string
  ): { user: Omit<UserEntity, 'passwordHash'>; token: string } {
    const cleanEmail = email.toLowerCase().trim();
    const user = this.db.getUserByEmail(cleanEmail);
    if (!user) {
      throw new Error('No existe una cuenta con este correo.');
    }

    if (user.passwordHash && password) {
      const hash = this.db.hashPassword(password);
      if (user.passwordHash !== hash) {
        throw new Error('Contraseña incorrecta.');
      }
    }

    this.db.updateUser(user.id, { lastLoginAt: Date.now() });

    const token = this.generateToken(user.id);
    const { passwordHash, ...safe } = user;
    return { user: safe, token };
  }

  public authenticateGoogle(profile: { email: string; name?: string; picture?: string; sub?: string }): {
    user: Omit<UserEntity, 'passwordHash'>;
    token: string;
  } {
    const cleanEmail = profile.email.toLowerCase().trim();
    let user = this.db.getUserByEmail(cleanEmail);

    if (!user) {
      user = this.db.createUser({
        email: cleanEmail,
        name: profile.name,
        role: cleanEmail === 'muhammaddris.dd@gmail.com' ? 'admin' : 'user',
      });
    }

    if (profile.picture && (!user.avatarUrl || user.avatarUrl.includes('kiran-emblem'))) {
      user = this.db.updateUser(user.id, { avatarUrl: profile.picture });
    }

    const token = this.generateToken(user.id);
    const { passwordHash, ...safe } = user;
    return { user: safe, token };
  }

  public getUserById(id: string): UserEntity | undefined {
    return this.db.getUserById(id);
  }

  public updateUser(id: string, updates: Partial<UserEntity>): UserEntity {
    return this.db.updateUser(id, updates);
  }

  public listAllUsers(): Omit<UserEntity, 'passwordHash'>[] {
    return this.db.listUsers().map(({ passwordHash, ...safe }) => safe);
  }
}
