import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildExperienceResponse,
  EXPERIENCE_BACKEND_GUARDRAILS,
  type ExperienceCard,
  type ExperienceRequest,
} from './experience-backend';

function request(): ExperienceRequest {
  return {
    tenantId: 'tenant-a',
    userId: 'user-a',
    surface: 'EXECUTIVE_HOME',
    offline: true,
  };
}

function card(): ExperienceCard {
  return {
    id: 'card-1',
    title: 'Operations changed',
    summary: 'Three operational signals require review.',
    confidence: 0.8,
    evidenceRefs: ['evidence:1'],
    action: {
      label: 'Review evidence',
      actionClass: 'NAVIGATION',
      approvalRequired: true,
    },
  };
}

test('experience guardrails preserve zero production authority', () => {
  assert.equal(EXPERIENCE_BACKEND_GUARDRAILS.tenantIsolationRequired, true);
  assert.equal(
    EXPERIENCE_BACKEND_GUARDRAILS.humanApprovalForConsequentialActions,
    true,
  );
  assert.equal(EXPERIENCE_BACKEND_GUARDRAILS.productionMutationAllowed, false);
  assert.equal(Object.isFrozen(EXPERIENCE_BACKEND_GUARDRAILS), true);
});

test('response is detached from caller card mutation', () => {
  const input = card();
  const response = buildExperienceResponse(request(), [input]);

  input.title = 'MUTATED';
  input.summary = 'MUTATED';
  input.evidenceRefs.push('evidence:smuggled');

  assert.equal(response.cards[0]?.title, 'Operations changed');
  assert.equal(
    response.cards[0]?.summary,
    'Three operational signals require review.',
  );
  assert.deepEqual(response.cards[0]?.evidenceRefs, ['evidence:1']);
});

test('request accessors are refused without invocation', () => {
  const input = request();
  let invoked = 0;

  Object.defineProperty(input, 'tenantId', {
    enumerable: true,
    get() {
      invoked += 1;
      return 'tenant-a';
    },
  });

  assert.throws(
    () => buildExperienceResponse(input, [card()]),
    /experience|request|fail closed/i,
  );

  assert.equal(invoked, 0);
});

test('card accessors are refused without invocation', () => {
  const input = card();
  let invoked = 0;

  Object.defineProperty(input, 'title', {
    enumerable: true,
    get() {
      invoked += 1;
      return 'Operations changed';
    },
  });

  assert.throws(
    () => buildExperienceResponse(request(), [input]),
    /experience|card|fail closed/i,
  );

  assert.equal(invoked, 0);
});

test('undeclared request properties fail closed', () => {
  const input = request() as ExperienceRequest & {
    admin?: boolean;
  };

  input.admin = true;

  assert.throws(
    () => buildExperienceResponse(input, [card()]),
    /experience|request|fail closed/i,
  );
});

test('undeclared card properties fail closed', () => {
  const input = card() as ExperienceCard & {
    productionCommand?: string;
  };

  input.productionCommand = 'deploy';

  assert.throws(
    () => buildExperienceResponse(request(), [input]),
    /experience|card|fail closed/i,
  );
});

test('unknown surfaces fail closed', () => {
  const input = request();
  input.surface = 'ROOT_ADMIN' as ExperienceRequest['surface'];

  assert.throws(
    () => buildExperienceResponse(input, [card()]),
    /experience|surface|fail closed/i,
  );
});

test('confidence must be finite and bounded', () => {
  for (const confidence of [
    -0.01,
    1.01,
    Number.NaN,
    Number.POSITIVE_INFINITY,
  ]) {
    const input = card();
    input.confidence = confidence;

    assert.throws(
      () => buildExperienceResponse(request(), [input]),
      /experience|confidence|card|fail closed/i,
    );
  }
});

test('identity and card identifiers are bounded and non-empty', () => {
  const emptyTenant = request();
  emptyTenant.tenantId = '';

  assert.throws(
    () => buildExperienceResponse(emptyTenant, [card()]),
    /experience|identity|request|fail closed/i,
  );

  const emptyCard = card();
  emptyCard.id = '';

  assert.throws(
    () => buildExperienceResponse(request(), [emptyCard]),
    /experience|card|id|fail closed/i,
  );
});

test('evidence references must be bounded strings', () => {
  const empty = card();
  empty.evidenceRefs = [''];

  assert.throws(
    () => buildExperienceResponse(request(), [empty]),
    /experience|evidence|card|fail closed/i,
  );

  const excessive = card();
  excessive.evidenceRefs = Array.from(
    { length: 1000 },
    (_, i) => `evidence:${i}`,
  );

  assert.throws(
    () => buildExperienceResponse(request(), [excessive]),
    /experience|evidence|card|fail closed/i,
  );
});

test('consequential actions require approval structurally', () => {
  const input = card();
  input.action = {
    label: 'Deploy to production',
    actionClass: 'CONSEQUENTIAL',
    approvalRequired: false,
  };

  assert.throws(
    () => buildExperienceResponse(request(), [input]),
    /EXPERIENCE_BACKEND_FAIL_CLOSED/,
  );
});

test('response and nested card structures are frozen', () => {
  const response = buildExperienceResponse(request(), [card()]);

  assert.equal(Object.isFrozen(response), true);
  assert.equal(Object.isFrozen(response.cards), true);
  assert.equal(Object.isFrozen(response.cards[0]), true);
  assert.equal(Object.isFrozen(response.cards[0]?.evidenceRefs), true);

  if (response.cards[0]?.action) {
    assert.equal(Object.isFrozen(response.cards[0].action), true);
  }
});

test('action-class semantic matrix is exact', () => {
  const informational = card();
  informational.action = {
    label: 'Explain this',
    actionClass: 'INFORMATIONAL',
    approvalRequired: false,
  };

  const informationalResponse =
    buildExperienceResponse(request(), [informational]);

  assert.equal(
    informationalResponse.cards[0]?.action?.actionClass,
    'INFORMATIONAL',
  );

  const navigation = card();
  navigation.action = {
    label: 'Open evidence',
    actionClass: 'NAVIGATION',
    approvalRequired: false,
  };

  const navigationResponse =
    buildExperienceResponse(request(), [navigation]);

  assert.equal(
    navigationResponse.cards[0]?.action?.actionClass,
    'NAVIGATION',
  );

  const consequential = card();
  consequential.action = {
    label: 'Submit proposed change',
    actionClass: 'CONSEQUENTIAL',
    approvalRequired: true,
  };

  const consequentialResponse =
    buildExperienceResponse(request(), [consequential]);

  assert.equal(
    consequentialResponse.cards[0]?.action?.actionClass,
    'CONSEQUENTIAL',
  );

  assert.equal(
    consequentialResponse.cards[0]?.action?.approvalRequired,
    true,
  );
});

test('unknown action classes fail closed', () => {
  const input = card();

  input.action = {
    label: 'Unknown action',
    actionClass: 'ROOT_EXECUTE' as 'NAVIGATION',
    approvalRequired: true,
  };

  assert.throws(
    () => buildExperienceResponse(request(), [input]),
    /EXPERIENCE_BACKEND_FAIL_CLOSED/,
  );
});

test('action accessors fail closed without invocation', () => {
  const input = card();
  let invoked = 0;

  const action = {
    label: 'Open evidence',
    actionClass: 'NAVIGATION',
    approvalRequired: false,
  };

  Object.defineProperty(action, 'actionClass', {
    enumerable: true,
    get() {
      invoked += 1;
      return 'NAVIGATION';
    },
  });

  input.action = action as ExperienceCard['action'];

  assert.throws(
    () => buildExperienceResponse(request(), [input]),
    /EXPERIENCE_BACKEND_FAIL_CLOSED/,
  );

  assert.equal(invoked, 0);
});

test('hidden and symbol action fields fail closed', () => {
  const hidden = card();

  const hiddenAction = {
    label: 'Open evidence',
    actionClass: 'NAVIGATION',
    approvalRequired: false,
  };

  Object.defineProperty(hiddenAction, 'productionAuthority', {
    value: true,
    enumerable: false,
  });

  hidden.action = hiddenAction as ExperienceCard['action'];

  assert.throws(
    () => buildExperienceResponse(request(), [hidden]),
    /EXPERIENCE_BACKEND_FAIL_CLOSED/,
  );

  const symbolic = card();

  const symbolAction = {
    label: 'Open evidence',
    actionClass: 'NAVIGATION',
    approvalRequired: false,
  };

  Object.defineProperty(symbolAction, Symbol('authority'), {
    value: true,
    enumerable: true,
  });

  symbolic.action = symbolAction as ExperienceCard['action'];

  assert.throws(
    () => buildExperienceResponse(request(), [symbolic]),
    /EXPERIENCE_BACKEND_FAIL_CLOSED/,
  );
});

test('returned action is detached from caller mutation', () => {
  const input = card();

  input.action = {
    label: 'Open evidence',
    actionClass: 'NAVIGATION',
    approvalRequired: false,
  };

  const response = buildExperienceResponse(request(), [input]);

  input.action.label = 'MUTATED';
  input.action.actionClass = 'CONSEQUENTIAL';
  input.action.approvalRequired = true;

  assert.equal(
    response.cards[0]?.action?.label,
    'Open evidence',
  );

  assert.equal(
    response.cards[0]?.action?.actionClass,
    'NAVIGATION',
  );

  assert.equal(
    response.cards[0]?.action?.approvalRequired,
    false,
  );
});
