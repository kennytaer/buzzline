import type { SalesAgent } from '@buzzline/types';
import type { KVClient } from '../kv-client';
import { KVKeys } from '~/types/cloudflare';
import { v4 as uuidv4 } from 'uuid';

export class SalesAgentRepository {
  constructor(
    private kv: KVClient,
    private organizationId: string
  ) {}

  async create(agentData: Omit<SalesAgent, 'id' | 'createdAt' | 'updatedAt'>): Promise<SalesAgent> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const agent: SalesAgent = {
      id,
      ...agentData,
      isActive: agentData.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };

    // Store the agent
    await this.kv.put(KVKeys.salesAgent(this.organizationId, id), agent);

    // Update indexes
    await this.updateAgentIndexes(agent, null);

    return agent;
  }

  async findById(id: string): Promise<SalesAgent | null> {
    return await this.kv.get<SalesAgent>(KVKeys.salesAgent(this.organizationId, id));
  }

  async update(id: string, updates: Partial<SalesAgent>): Promise<SalesAgent | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated: SalesAgent = {
      ...existing,
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString(),
    };

    // Store updated agent
    await this.kv.put(KVKeys.salesAgent(this.organizationId, id), updated);

    // Update indexes if relevant fields changed
    if (existing.isActive !== updated.isActive) {
      await this.updateAgentIndexes(updated, existing);
    }

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;

    // Remove from storage
    await this.kv.delete(KVKeys.salesAgent(this.organizationId, id));

    // Remove from all indexes
    await this.removeFromAllIndexes(existing);

    return true;
  }

  async findAll(): Promise<SalesAgent[]> {
    const agentIds = await this.kv.getFromIndex(
      KVKeys.agentsByOrg(this.organizationId)
    );

    if (agentIds.length === 0) return [];

    const promises = agentIds.map(id => this.findById(id));
    const results = await Promise.all(promises);
    
    return results.filter(Boolean) as SalesAgent[];
  }

  async findActive(): Promise<SalesAgent[]> {
    const agentIds = await this.kv.getFromIndex(
      KVKeys.agentsByStatus(this.organizationId, 'active')
    );

    if (agentIds.length === 0) return [];

    const promises = agentIds.map(id => this.findById(id));
    const results = await Promise.all(promises);
    
    return results.filter(Boolean) as SalesAgent[];
  }

  async bulkCreate(agents: Array<Omit<SalesAgent, 'id' | 'createdAt' | 'updatedAt'>>): Promise<SalesAgent[]> {
    const results: SalesAgent[] = [];

    for (const agentData of agents) {
      try {
        const agent = await this.create(agentData);
        results.push(agent);
      } catch (error) {
        console.error(`Failed to create agent ${agentData.firstName} ${agentData.lastName}:`, error);
      }
    }

    return results;
  }

  async toggleActive(id: string): Promise<SalesAgent | null> {
    const agent = await this.findById(id);
    if (!agent) return null;

    return await this.update(id, { isActive: !agent.isActive });
  }

  // Private helper methods
  private async updateAgentIndexes(agent: SalesAgent, previousAgent: SalesAgent | null): Promise<void> {
    const promises: Promise<void>[] = [];

    // Add to organization index
    promises.push(this.kv.addToIndex(
      KVKeys.agentsByOrg(this.organizationId),
      agent.id
    ));

    // Add to status index
    const statusKey = agent.isActive ? 'active' : 'inactive';
    promises.push(this.kv.addToIndex(
      KVKeys.agentsByStatus(this.organizationId, statusKey),
      agent.id
    ));

    // Remove from old status index if updating
    if (previousAgent && previousAgent.isActive !== agent.isActive) {
      const oldStatusKey = previousAgent.isActive ? 'active' : 'inactive';
      promises.push(this.kv.removeFromIndex(
        KVKeys.agentsByStatus(this.organizationId, oldStatusKey),
        agent.id
      ));
    }

    await Promise.all(promises);
  }

  private async removeFromAllIndexes(agent: SalesAgent): Promise<void> {
    const promises: Promise<void>[] = [];

    // Remove from organization index
    promises.push(this.kv.removeFromIndex(
      KVKeys.agentsByOrg(this.organizationId),
      agent.id
    ));

    // Remove from status index
    const statusKey = agent.isActive ? 'active' : 'inactive';
    promises.push(this.kv.removeFromIndex(
      KVKeys.agentsByStatus(this.organizationId, statusKey),
      agent.id
    ));

    await Promise.all(promises);
  }
}