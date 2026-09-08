import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { DEPLOYMENT_STATE, SECURITY_LOCK, TRANSPORT_TIERS, isTransportTierReachable } from '../flags';
import { expectOk, intelWorkstation, newFabric, operator } from './fixtures';

/**
 * Story sections 31 and 32. The lock is data, not prose: the fabric reads these
 * flags at runtime and refuses anything they close.
 */

describe('62D security lock', () => {
  it('ships queued with every autonomous capability disabled', () => {
    assert.equal(DEPLOYMENT_STATE, 'QUEUED');
    assert.deepEqual(SECURITY_LOCK, {
      L4_AUTONOMY_ENABLED: false,
      AUTO_DEPLOY: false,
      AUTO_SCALE_AUTHORITY: false,
      AUTO_PERMISSION_EXPANSION: false,
      AUTO_SATELLITE_ACCESS: false,
      AUTO_EXTERNAL_ACCOUNT_CREATION: false,
      AUTO_PRODUCTION_MUTATION: false,
    });
    assert.equal(Object.isFrozen(SECURITY_LOCK), true);
  });

  it('keeps the orbital tiers unconfigured while the terrestrial tiers are architected', () => {
    assert.equal(TRANSPORT_TIERS.satellite_gateway, 'unconfigured');
    assert.equal(TRANSPORT_TIERS.orbital_node, 'unconfigured');
    assert.equal(isTransportTierReachable('satellite_gateway'), false);
    assert.equal(isTransportTierReachable('orbital_node'), false);

    assert.equal(isTransportTierReachable('device'), true);
    assert.equal(isTransportTierReachable('edge'), true);
    assert.equal(isTransportTierReachable('cloud'), true);
    assert.equal(isTransportTierReachable('data_center'), true);
    assert.equal(isTransportTierReachable('terrestrial_network'), true);
  });

  it('refuses to enroll a node behind an unconfigured transport tier', () => {
    const fabric = newFabric();
    const op = operator();

    const denial = fabric.registerRuntime(op, {
      deviceId: 'device_orbital_1',
      nodeType: 'edge_gateway',
      transportTier: 'satellite_gateway',
      hardware: intelWorkstation(),
      allowedWorkloads: ['analysis'],
    });

    assert.equal(denial.ok, false);
    assert.equal(denial.ok === false && denial.code, 'autonomy_locked');

    const events = expectOk(fabric.listSecurityEvents(op), 'listSecurityEvents').events;
    assert.ok(events.some((event) => event.kind === 'satellite_access_blocked'));
  });

  it('closes the resource growth path even for a human operator while the lock holds', () => {
    const fabric = newFabric();
    const denial = fabric.requestResourceIncrease(operator(), {
      owner: { kind: 'universe', id: 'universe_alpha' },
      additional: { gpuMillis: 1_000_000 },
      justification: 'quarter end analysis peak',
    });

    assert.equal(denial.ok, false);
    assert.equal(denial.ok === false && denial.code, 'permission_expansion_forbidden');
  });
});
