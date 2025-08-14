import type { KVEnvironment } from '@buzzline/types';
import { createKVClient } from '../kv-client';
import { ContactRepository } from './contact-repository';
import { ContactListRepository } from './contact-list-repository';
import { CampaignRepository } from './campaign-repository';
import { UserRepository } from './user-repository';
import { OrganizationRepository } from './organization-repository';
import { SalesAgentRepository } from './sales-agent-repository';

export class RepositoryFactory {
  private contactRepo?: ContactRepository;
  private contactListRepo?: ContactListRepository;
  private campaignRepo?: CampaignRepository;
  private userRepo?: UserRepository;
  private organizationRepo?: OrganizationRepository;
  private salesAgentRepo?: SalesAgentRepository;

  constructor(
    private env: KVEnvironment,
    private organizationId: string
  ) {}

  get contacts(): ContactRepository {
    if (!this.contactRepo) {
      const kvClient = createKVClient(this.env, this.organizationId);
      this.contactRepo = new ContactRepository(kvClient, this.organizationId);
    }
    return this.contactRepo;
  }

  get contactLists(): ContactListRepository {
    if (!this.contactListRepo) {
      const kvClient = createKVClient(this.env, this.organizationId);
      this.contactListRepo = new ContactListRepository(kvClient, this.organizationId);
    }
    return this.contactListRepo;
  }

  get campaigns(): CampaignRepository {
    if (!this.campaignRepo) {
      const kvClient = createKVClient(this.env, this.organizationId);
      this.campaignRepo = new CampaignRepository(kvClient, this.organizationId);
    }
    return this.campaignRepo;
  }

  get users(): UserRepository {
    if (!this.userRepo) {
      const kvClient = createKVClient(this.env, this.organizationId);
      this.userRepo = new UserRepository(kvClient, this.organizationId);
    }
    return this.userRepo;
  }

  get organization(): OrganizationRepository {
    if (!this.organizationRepo) {
      const kvClient = createKVClient(this.env, this.organizationId);
      this.organizationRepo = new OrganizationRepository(kvClient, this.organizationId);
    }
    return this.organizationRepo;
  }

  get salesAgents(): SalesAgentRepository {
    if (!this.salesAgentRepo) {
      const kvClient = createKVClient(this.env, this.organizationId);
      this.salesAgentRepo = new SalesAgentRepository(kvClient, this.organizationId);
    }
    return this.salesAgentRepo;
  }
}

// Helper function to create repository factory from Remix context
export function createRepositories(env: KVEnvironment, organizationId: string): RepositoryFactory {
  return new RepositoryFactory(env, organizationId);
}

// Export individual repositories
export { ContactRepository } from './contact-repository';
export { ContactListRepository } from './contact-list-repository';
export { CampaignRepository } from './campaign-repository';
export { UserRepository } from './user-repository';
export { OrganizationRepository } from './organization-repository';
export { SalesAgentRepository } from './sales-agent-repository';