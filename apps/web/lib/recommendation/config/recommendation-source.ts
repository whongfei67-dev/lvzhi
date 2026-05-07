import { userTypeLibrary } from "../../../../../../lvzhi_recommendation_system_package/01_user_type_library";
import { userMindsetLibrary } from "../../../../../../lvzhi_recommendation_system_package/02_user_mindset_library";
import {
  deliveryTags,
  legalDomainTags,
  locationServiceTags,
  priceTags,
  recommendationTags,
  riskComplianceTags,
  scenarioTagGroups,
  serviceStageTags,
} from "../../../../../../lvzhi_recommendation_system_package/03_internal_tag_library";
import {
  getRecommendationReason,
  recommendationReasonMatrix,
} from "../../../../../../lvzhi_recommendation_system_package/04_recommendation_reason_matrix";
import { AMBIGUOUS_SCOPE_CORPUS, CIVIL_SCOPE_CORPUS, CRIMINAL_SCOPE_CORPUS } from "./cause-scope-corpus";
import {
  CIVIL_CAUSE_LABEL_SET,
  CIVIL_CAUSE_LIBRARY,
  CIVIL_CAUSE_LEAF_LABEL_SET,
  CIVIL_CAUSE_ROOT_LABEL,
} from "./civil-cause-library";
import {
  CRIMINAL_CAUSE_LABEL_SET,
  CRIMINAL_CAUSE_LIBRARY,
  CRIMINAL_CAUSE_LEAF_LABEL_SET,
  CRIMINAL_CAUSE_ROOT_LABEL,
} from "./criminal-cause-library";
import { CIVIL_CAUSE_ALIAS_TO_LABEL } from "./civil-cause-aliases";
import { CRIMINAL_CAUSE_ALIAS_TO_LABEL } from "./criminal-cause-aliases";

export {
  deliveryTags,
  CIVIL_CAUSE_LABEL_SET,
  CIVIL_CAUSE_LEAF_LABEL_SET,
  CIVIL_CAUSE_LIBRARY,
  CIVIL_CAUSE_ROOT_LABEL,
  CIVIL_CAUSE_ALIAS_TO_LABEL,
  CIVIL_SCOPE_CORPUS,
  CRIMINAL_CAUSE_LABEL_SET,
  CRIMINAL_CAUSE_LEAF_LABEL_SET,
  CRIMINAL_CAUSE_LIBRARY,
  CRIMINAL_CAUSE_ROOT_LABEL,
  CRIMINAL_CAUSE_ALIAS_TO_LABEL,
  CRIMINAL_SCOPE_CORPUS,
  AMBIGUOUS_SCOPE_CORPUS,
  getRecommendationReason,
  legalDomainTags,
  locationServiceTags,
  priceTags,
  recommendationReasonMatrix,
  recommendationTags,
  riskComplianceTags,
  scenarioTagGroups,
  serviceStageTags,
  userMindsetLibrary,
  userTypeLibrary,
};

export type RecommendationUserTypeId = (typeof userTypeLibrary)[number]["id"];
export type RecommendationMindsetId = (typeof userMindsetLibrary)[number]["id"];
export type RecommendationUserTypeGroup = (typeof userTypeLibrary)[number]["group"];
