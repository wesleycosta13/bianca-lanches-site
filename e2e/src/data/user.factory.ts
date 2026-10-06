import { fakerPT_BR as faker } from "@faker-js/faker";

/**
 * Factory para geração de dados de usuários e credenciais usando Faker.js.
 */
export class UserDataFactory {
  static createInvalidCredentials() {
    return {
      email: faker.internet.email().toLowerCase(),
      password: faker.internet.password({ length: 14 }),
    };
  }

  static createRandomSearchQuery(): string {
    return faker.word.noun();
  }
}
