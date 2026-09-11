import { strict as assert } from 'node:assert';
import { mayCapture, mobilityMediaPolicy } from './consent-mobility-media-intelligence';
import { canLicenseInsight, dataCooperativePolicy } from './privacy-preserving-data-cooperative';
import { isVerifiedPartner, mayExchangePrivateData } from './legal-contract-partner-registry';
import { mayOperate } from './smart-device-universe-mesh';
import { canPublishHistoricalArticle } from './daily-briefing-historical-article-engine';

assert.equal(mayCapture({tenantId:'t',userId:'u',signal:'LOCATION',source:'DEVICE',capturedAt:new Date().toISOString(),classification:'PRIVATE',consentReceiptId:'r',rawPayloadStoredLocally:true},{userId:'u',signal:'LOCATION',state:'GRANTED',scope:['local'],receiptId:'r'}), true);
assert.equal(mobilityMediaPolicy.rawPersonalDataSaleAllowed, false);
assert.equal(canLicenseInsight({insightId:'i',metric:'mobility-flow',cohortSize:100,sourceCount:100,deidentified:true,aggregated:true,kThreshold:20,status:'APPROVED',evidenceRefs:['e'],containsRawPersonalData:false}), true);
assert.equal(dataCooperativePolicy.reidentificationProhibited, true);
const partner={partnerId:'p',displayName:'Target Partner',state:'VERIFIED_PARTNER' as const,contractType:'API' as const,jurisdiction:['US'],agreementReceiptId:'a',apiReceiptId:'api',humanApproved:true,dataScopes:['aggregate']};
assert.equal(isVerifiedPartner(partner), true);
assert.equal(mayExchangePrivateData(partner), true);
assert.equal(mayOperate({deviceId:'d',userId:'u',kind:'SMART_TV',state:'VERIFIED',consentReceiptId:'c',localOnly:true,allowedCapabilities:['viewing-summary']}), true);
assert.equal(canPublishHistoricalArticle({userId:'u',generatedAt:new Date().toISOString(),topics:['history'],tailored:true,containsUnsupportedFact:false,evidence:[{ref:'src',sourceType:'PUBLIC_HISTORY',confidence:.9,classification:'PUBLIC'}]}), true);
console.log('12D-78 consent mobility/media/data cooperative/legal/device/briefing contracts: OK');
