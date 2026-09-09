import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/xiv/button';
import { Card } from '@/components/xiv/card';
import { Chip } from '@/components/xiv/chip';
import { Field } from '@/components/xiv/field';
import { XivText } from '@/components/xiv/text';
import { Palette, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import { useTenant } from '@/context/tenant';
import { tenantPersistenceStatus, type PersistedClassification } from '../../../../../services/ai/runtime/tenant';

const CLASSIFICATIONS: readonly PersistedClassification[] = ['internal', 'confidential', 'restricted', 'public'];

function bootstrapLabel(status: string) {
  if (status === 'creating') return 'Creating...';
  if (status === 'ready') return 'Ready';
  if (status === 'denied') return 'Denied';
  if (status === 'failed') return 'Failed';
  return null;
}

export function TenantDesk() {
  const { session } = useSession();
  const {
    tenant,
    selectOrganization,
    selectUniverse,
    createOrganization,
    createUniverse,
    canCreateUniverse,
    persistenceLabel,
    orgBootstrapStatus,
    universeBootstrapStatus,
    refresh,
  } = useTenant();
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [universeName, setUniverseName] = useState('');
  const [universeSlug, setUniverseSlug] = useState('');
  const [classification, setClassification] = useState<PersistedClassification>('internal');
  const [orgMessage, setOrgMessage] = useState<string | null>(null);
  const [universeMessage, setUniverseMessage] = useState<string | null>(null);
  const persistenceReady = tenant.persistenceStatus === 'ready';

  return (
    <Card style={styles.card}>
      <XivText variant="label" color={Palette.accent}>
        Tenant context
      </XivText>
      <XivText variant="caption" dim>
        Tenant status: {tenantPersistenceStatus() === 'live' ? 'TENANT PERSISTENCE LIVE' : 'TENANT PERSISTENCE BLOCKED'}.
        {tenant.activeOrganization
          ? ` Organization: ${tenant.activeOrganization.name}. Role: ${tenant.organizationRole ?? 'unknown'}.`
          : ' No active organization.'}
        {tenant.activeUniverse ? ` Universe: ${tenant.activeUniverse.name}.` : ' No active Universe.'} UI state is not
        authorization. Server/RLS stays authoritative.
      </XivText>
      <XivText variant="caption" dim>
        {persistenceLabel} Experience role ({session.experience || 'none'}) is not organization authorization.
      </XivText>
      {tenant.error ? (
        <XivText variant="caption" color={Palette.warning}>
          {tenant.error}
        </XivText>
      ) : null}

      <XivText variant="label" color={Palette.textDim}>
        Organizations
      </XivText>
      {tenant.organizations.length === 0 ? (
        <XivText variant="caption" muted>
          No persisted organization memberships for this account.
        </XivText>
      ) : (
        <View style={styles.row}>
          {tenant.organizations.map((organization) => (
            <Chip
              key={organization.id}
              label={`${organization.name} · ${organization.status}`}
              compact
              selected={tenant.activeOrganization?.id === organization.id}
              onPress={() => {
                void selectOrganization(organization.id);
              }}
            />
          ))}
        </View>
      )}
      {tenant.activeOrganization ? (
        <XivText variant="caption" muted>
          Active organization role: {tenant.organizationRole ?? 'unknown'} · {tenant.activeOrganization.slug}
        </XivText>
      ) : null}

      <Field label="Organization name" value={orgName} onChangeText={setOrgName} placeholder="Northstar Logistics" />
      <Field label="Slug (optional)" value={orgSlug} onChangeText={setOrgSlug} autoCapitalize="none" placeholder="northstar-logistics" />
      <Button
        label={orgBootstrapStatus === 'creating' ? 'Creating...' : 'Create organization'}
        variant="subtle"
        disabled={!persistenceReady || tenant.loading || orgBootstrapStatus === 'creating'}
        onPress={() => {
          void createOrganization({ name: orgName, slug: orgSlug || undefined }).then((result) => {
            setOrgMessage(`${bootstrapLabel(result.status) ?? result.status}. ${result.message}`);
            if (result.status === 'ready') {
              setOrgName('');
              setOrgSlug('');
            }
          });
        }}
      />
      {orgMessage ? (
        <XivText variant="caption" color={Palette.warning}>
          {orgMessage}
        </XivText>
      ) : null}

      <XivText variant="label" color={Palette.textDim}>
        Universes
      </XivText>
      {!tenant.activeUniverse ? (
        <XivText variant="caption" muted>
          Universe not provisioned
        </XivText>
      ) : (
        <XivText variant="body">
          {tenant.activeUniverse.name} · {tenant.activeUniverse.status}
        </XivText>
      )}
      {tenant.universes.length > 0 ? (
        <View style={styles.row}>
          {tenant.universes.map((universe) => (
            <Chip
              key={universe.id}
              label={`${universe.name} · ${universe.status}`}
              compact
              selected={tenant.activeUniverse?.id === universe.id}
              onPress={() => {
                void selectUniverse(universe.id);
              }}
            />
          ))}
        </View>
      ) : null}

      <Field label="Universe name" value={universeName} onChangeText={setUniverseName} placeholder="Primary Universe" />
      <Field label="Slug (optional)" value={universeSlug} onChangeText={setUniverseSlug} autoCapitalize="none" placeholder="primary" />
      <View style={styles.row}>
        {CLASSIFICATIONS.map((item) => (
          <Chip
            key={item}
            label={item}
            compact
            selected={classification === item}
            onPress={() => setClassification(item)}
          />
        ))}
      </View>
      <XivText variant="caption" dim>
        Storage tier metadata: business. Object storage is not configured.
      </XivText>
      <Button
        label={universeBootstrapStatus === 'creating' ? 'Creating...' : 'Create Universe'}
        variant="subtle"
        disabled={!persistenceReady || !canCreateUniverse || tenant.loading || universeBootstrapStatus === 'creating'}
        onPress={() => {
          void createUniverse({
            name: universeName,
            slug: universeSlug || undefined,
            classification,
          }).then((result) => {
            setUniverseMessage(`${bootstrapLabel(result.status) ?? result.status}. ${result.message}`);
            if (result.status === 'ready') {
              setUniverseName('');
              setUniverseSlug('');
            }
          });
        }}
      />
      {!canCreateUniverse && tenant.activeOrganization ? (
        <XivText variant="caption" dim>
          Universe create requires organization owner or admin membership.
        </XivText>
      ) : null}
      {universeMessage ? (
        <XivText variant="caption" color={Palette.warning}>
          {universeMessage}
        </XivText>
      ) : null}
      <Button label="Refresh memberships" variant="subtle" disabled={tenant.loading} onPress={() => void refresh()} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
