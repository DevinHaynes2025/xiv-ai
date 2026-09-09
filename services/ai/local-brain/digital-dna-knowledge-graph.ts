/**
 * 62L-DU Module G — Digital DNA Knowledge Graph.
 * Licensed reusable software/knowledge/workflow patterns + cultural knowledge.
 * Digital DNA ≠ unauthorized cloning of people/IP.
 * Agent learning ≠ permission grants.
 */

import { readJsonFile, writeJsonFileAtomic, xivLocalPath } from './durable-json';
import {
  DIGITAL_DNA_NEQ_CLONING,
  LEARNING_NEQ_PERMISSION,
  MAX_DNA_PATTERNS,
  type DuActor,
} from './universal-industry-intelligence-os-types';

export type DigitalDnaPattern = {
  id: string;
  name: string;
  licensed: boolean;
  clonesPeopleOrIp: false;
  grantsPermission: false;
  status: 'registered' | 'denied';
  reason: string;
  createdAt: string;
};

export type DnaLearningEvent = {
  id: string;
  patternId: string;
  learned: boolean;
  grantsPermission: false;
  status: 'bounded' | 'denied';
  reason: string;
  at: string;
};

type Store = {
  patterns: DigitalDnaPattern[];
  learnings: DnaLearningEvent[];
};

function storePath(root: string) {
  return xivLocalPath(root, 'digital-dna-knowledge-graph.json');
}

async function load(root: string): Promise<Store> {
  return readJsonFile<Store>(storePath(root), { patterns: [], learnings: [] });
}

async function save(root: string, store: Store) {
  await writeJsonFileAtomic(storePath(root), store);
}

function id(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function digitalDnaKnowledgeGraphHonesty() {
  return {
    digitalDnaEqCloning: false,
    learningEqPermission: false,
    licensedOnly: true,
    unauthorizedIpClone: false,
    peopleClone: false,
  };
}

export async function registerDigitalDnaPattern(input: {
  name: string;
  licensed: boolean;
  attemptClonePeopleOrIp?: boolean;
  root: string;
  actor: DuActor;
}): Promise<DigitalDnaPattern> {
  const store = await load(input.root);
  void input.actor;
  if (store.patterns.length >= MAX_DNA_PATTERNS) {
    throw new Error('MAX_DNA_PATTERNS_REACHED');
  }
  const cloning = input.attemptClonePeopleOrIp === true;
  const denied = !input.licensed || cloning;
  const pattern: DigitalDnaPattern = {
    id: id('dudna'),
    name: input.name.trim(),
    licensed: input.licensed,
    clonesPeopleOrIp: false,
    grantsPermission: false,
    status: denied ? 'denied' : 'registered',
    reason: cloning
      ? DIGITAL_DNA_NEQ_CLONING
      : !input.licensed
        ? DIGITAL_DNA_NEQ_CLONING
        : 'DIGITAL_DNA_LICENSED_PATTERN_REGISTERED',
    createdAt: new Date().toISOString(),
  };
  store.patterns.push(pattern);
  await save(input.root, store);
  return pattern;
}

export async function recordDnaLearning(input: {
  patternId: string;
  claimPermissionGrant?: boolean;
  root: string;
  actor: DuActor;
}): Promise<DnaLearningEvent> {
  const store = await load(input.root);
  void input.actor;
  const claiming = input.claimPermissionGrant === true;
  const event: DnaLearningEvent = {
    id: id('duleearn'),
    patternId: input.patternId,
    learned: true,
    grantsPermission: false,
    status: claiming ? 'denied' : 'bounded',
    reason: claiming ? LEARNING_NEQ_PERMISSION : 'LEARNING_BOUNDED_NO_PERMISSION_GRANT',
    at: new Date().toISOString(),
  };
  store.learnings.push(event);
  await save(input.root, store);
  return event;
}
