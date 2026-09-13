export type JoinPreview = { status:'REVIEW_REQUIRED'; membershipCreated:false; accountsConnected:false; devicesControlled:false; earningsGuaranteed:false; partnerStatus:'NOT_CONFIGURED'; communityId:string; nextSteps:readonly string[] };
export function previewCommunityJoin(input:{userId:string;communityId:string}):JoinPreview {
  if(!input.userId) throw new Error('authenticated_user_required');
  if(!/^[a-zA-Z0-9_-]{1,80}$/.test(input.communityId)) throw new Error('invalid_community');
  return {status:'REVIEW_REQUIRED',membershipCreated:false,accountsConnected:false,devicesControlled:false,earningsGuaranteed:false,partnerStatus:'NOT_CONFIGURED',communityId:input.communityId,nextSteps:['Review community purpose and rules','Choose what profile information to share','Confirm explicit membership consent']};
}
